import { load, type CheerioAPI } from 'cheerio';
import type { CarCreateInput } from '$lib/types';
import {
	extractJsonLd,
	findJsonLdType,
	metaContent,
	normalizeFuel,
	normalizeMakeOrUndef,
	parseIntSafe
} from './utils';
import { guessEngine } from './standvirtual';
import { buildTitle } from '$lib/listing';

export function parsePiscaPisca(html: string, url: string): Partial<CarCreateInput> {
	const $ = load(html);
	const result: Partial<CarCreateInput> = { url, source: 'PiscaPisca' };

	const vehicle = extractVehicle($);
	if (vehicle) {
		applyVehicle(result, vehicle);
		if (!result.imageUrl) result.imageUrl = metaContent($, 'meta[property="og:image"]');
		return result;
	}

	const blobs = extractJsonLd($);
	const product = findJsonLdType(blobs, ['Product', 'Vehicle', 'Car']);
	if (product) {
		if (typeof product.name === 'string') result.title = product.name.trim();
		if (typeof product.image === 'string') result.imageUrl = product.image;
		else if (Array.isArray(product.image) && typeof product.image[0] === 'string') {
			result.imageUrl = product.image[0];
		}
		if (typeof product.brand === 'string') result.make = normalizeMakeOrUndef(product.brand);
		else if (typeof product.brand === 'object' && product.brand !== null) {
			const brand = product.brand as { name?: unknown };
			if (typeof brand.name === 'string') result.make = normalizeMakeOrUndef(brand.name);
		}
		if (typeof product.model === 'string') result.model = product.model.trim();
		const offers = product.offers as { price?: unknown } | undefined;
		if (offers && typeof offers === 'object') {
			const p = parseIntSafe(offers.price as string | number);
			if (p) result.price = p;
		}
	}

	if (!result.title) {
		result.title = metaContent($, 'meta[property="og:title"]') || $('h1').first().text().trim() || undefined;
	}
	if (!result.imageUrl) result.imageUrl = metaContent($, 'meta[property="og:image"]');

	$('li, tr, p, dd, dt').each((_, el) => {
		const text = $(el).text().trim().replace(/\s+/g, ' ');
		if (!text || text.length > 200) return;

		if (!result.km) {
			const m = text.match(/(\d[\d\s.,]*)\s*km/i);
			if (m) result.km = parseIntSafe(m[1]);
		}
		if (!result.year) {
			const m = text.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
			if (m) result.year = parseIntSafe(m[1]);
		}
		if (!result.fuel && /(diesel|gasolina|gasoline)/i.test(text)) {
			result.fuel = normalizeFuel(text);
		}
		if (!result.power) {
			const m = text.match(/(\d{2,4})\s*cv/i);
			if (m) result.power = parseIntSafe(m[1]);
		}
	});

	return result;
}

type Vehicle = {
	brand?: string;
	model?: string;
	serie?: string;
	registerYear?: number;
	kms?: number;
	fuel?: string;
	powerCv?: number;
	cylinderCapacity?: number;
	origin?: string;
	standardWarranty?: string;
	transmission?: string;
	pricePrivate?: number;
	sellerType?: string;
	sellerInfo?: { address?: { county?: string; district?: string; city?: string } };
	images?: unknown[];
	notes?: string;
};

/** PiscaPisca is an Angular SSR app; the full vehicle record is in the <script id="ng-state"> transfer state. */
function extractVehicle($: CheerioAPI): Vehicle | null {
	const raw = $('script#ng-state').first().contents().text();
	if (!raw) return null;
	try {
		const state = JSON.parse(raw) as { VEHICLE_DETAIL?: Vehicle };
		return state.VEHICLE_DETAIL ?? null;
	} catch {
		return null;
	}
}

function stripHtml(s: string | undefined): string {
	return (s ?? '')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]+>/g, ' ')
		.replace(/[ \t]+/g, ' ')
		.replace(/\n\s*/g, '\n')
		.trim();
}

function applyVehicle(result: Partial<CarCreateInput>, v: Vehicle): void {
	result.make = normalizeMakeOrUndef(v.brand);
	result.model = v.model?.trim() || undefined;
	if (v.registerYear) result.year = v.registerYear;
	if (v.kms) result.km = v.kms;
	if (v.pricePrivate) result.price = v.pricePrivate;
	if (v.powerCv) result.power = v.powerCv;
	result.fuel = normalizeFuel(v.fuel);

	const description = stripHtml(v.notes);
	result.engine = guessEngine([v.serie, description].filter(Boolean).join(' '), v.cylinderCapacity);

	const addr = v.sellerInfo?.address;
	const municipality = addr?.county?.trim() || addr?.city?.trim();
	const district = addr?.district?.trim();
	if (municipality && district && municipality.toLowerCase() !== district.toLowerCase()) {
		result.location = `${municipality}, ${district}`;
	} else if (municipality || district) {
		result.location = municipality || district;
	}

	const seller = v.sellerType?.toLowerCase();
	if (seller?.startsWith('profission')) result.sellerType = 'dealer';
	else if (seller?.startsWith('particular')) result.sellerType = 'private';

	if (v.transmission) result.gearbox = v.transmission.trim();
	if (v.origin) result.imported = /import/i.test(v.origin);
	const warranty = v.standardWarranty?.match(/(\d+)\s*mes/i);
	if (warranty) result.warrantyMonths = parseInt(warranty[1], 10);
	if (Array.isArray(v.images)) result.photoCount = v.images.length;
	if (description) result.description = description.slice(0, 10_000);

	result.title = buildTitle(result, [v.brand, v.model, v.serie].filter(Boolean).join(' '));
}
