import { load, type CheerioAPI } from 'cheerio';
import type { CarCreateInput } from '$lib/types';
import { normalizeEngine } from '$lib/constants';
import {
	extractJsonLd,
	findJsonLdType,
	metaContent,
	normalizeFuel,
	normalizeMakeOrUndef,
	parseIntSafe
} from './utils';

export function parseStandVirtual(html: string, url: string): Partial<CarCreateInput> {
	const $ = load(html);
	const result: Partial<CarCreateInput> = { url, source: 'StandVirtual' };

	const blobs = extractJsonLd($);
	const product = findJsonLdType(blobs, ['Product', 'Vehicle', 'Car']);

	if (product) {
		if (typeof product.name === 'string') result.title = product.name.trim();
		if (typeof product.brand === 'object' && product.brand !== null) {
			const brand = product.brand as { name?: unknown };
			if (typeof brand.name === 'string') result.make = normalizeMakeOrUndef(brand.name);
		} else if (typeof product.brand === 'string') {
			result.make = normalizeMakeOrUndef(product.brand);
		}
		if (typeof product.model === 'string') result.model = product.model.trim();
		if (typeof product.image === 'string') result.imageUrl = product.image;
		else if (Array.isArray(product.image) && typeof product.image[0] === 'string') {
			result.imageUrl = product.image[0];
		}
		const offers = product.offers as { price?: unknown; priceCurrency?: unknown } | undefined;
		if (offers && typeof offers === 'object') {
			const p = parseIntSafe(offers.price as string | number);
			if (p) result.price = p;
		}
		if (typeof product.vehicleModelDate === 'string' || typeof product.vehicleModelDate === 'number') {
			const y = parseIntSafe(product.vehicleModelDate as string | number);
			if (y) result.year = y;
		}
		if (typeof product.fuelType === 'string') {
			result.fuel = normalizeFuel(product.fuelType);
		}
		const mileage = product.mileageFromOdometer as { value?: unknown } | undefined;
		if (mileage && typeof mileage === 'object') {
			const km = parseIntSafe(mileage.value as string | number);
			if (km) result.km = km;
		}
	}

	if (!result.title) {
		result.title = metaContent($, 'meta[property="og:title"]') || $('h1').first().text().trim() || undefined;
	}
	if (result.title) {
		result.title = result.title
			.replace(/\s*-\s*Standvirtual\.com\s*$/i, '')
			.replace(/^\s*Usado\s+/i, '')
			.trim();
	}
	if (!result.imageUrl) {
		result.imageUrl = metaContent($, 'meta[property="og:image"]');
	}

	$('[data-testid="advert-details-item"], li, p').each((_, el) => {
		const text = $(el).text().trim();
		if (!text || text.length > 200) return;
		if (!result.km) {
			const kmMatch = text.match(/(\d[\d\s.,]*)\s*km/i);
			if (kmMatch) result.km = parseIntSafe(kmMatch[1]);
		}
		if (!result.year) {
			const yearMatch = text.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
			if (yearMatch) result.year = parseIntSafe(yearMatch[1]);
		}
		if (!result.power) {
			const cv = text.match(/(\d{2,4})\s*cv/i);
			if (cv) result.power = parseIntSafe(cv[1]);
		}
	});

	const advert = extractAdvert($);
	if (advert) applyAdvert(result, advert);

	if (!result.location) {
		const locLabel = $('a[href*="/anuncios/"]').filter((_, el) => /distrito|localidade/i.test($(el).text())).first();
		if (locLabel.length) result.location = locLabel.text().trim();
	}

	return result;
}

type Advert = {
	title?: string;
	description?: string;
	price?: { value?: string | number };
	seller?: { location?: SellerLocation };
	parametersDict?: Record<string, { values?: Array<{ value?: string; label?: string }> }>;
};
type SellerLocation = { city?: string; region?: string; shortAddress?: string };

/** StandVirtual is a Next.js app; the full advert (seller location, specs) lives in __NEXT_DATA__. */
function extractAdvert($: CheerioAPI): Advert | null {
	const raw = $('script#__NEXT_DATA__').first().contents().text();
	if (!raw) return null;
	try {
		const data = JSON.parse(raw) as { props?: { pageProps?: { advert?: Advert } } };
		return data.props?.pageProps?.advert ?? null;
	} catch {
		return null;
	}
}

function param(advert: Advert, key: string): { value?: string; label?: string } | undefined {
	return advert.parametersDict?.[key]?.values?.[0];
}

function applyAdvert(result: Partial<CarCreateInput>, advert: Advert): void {
	// Structured specs are authoritative — they override the loose text-scan guesses above
	// (which can e.g. pick up the current year from page boilerplate).
	const make = normalizeMakeOrUndef(param(advert, 'make')?.label);
	if (make) result.make = make;
	const model = param(advert, 'model')?.label?.trim();
	if (model) result.model = model;
	const year = parseIntSafe(param(advert, 'first_registration_year')?.value);
	if (year) result.year = year;
	const km = parseIntSafe(param(advert, 'mileage')?.value);
	if (km) result.km = km;
	const power = parseIntSafe(param(advert, 'engine_power')?.value);
	if (power) result.power = power;
	const fuel = normalizeFuel(param(advert, 'fuel_type')?.label);
	if (fuel) result.fuel = fuel;
	const price = advert.price?.value != null ? parseIntSafe(advert.price.value) : undefined;
	if (price) result.price = price;

	const loc = sellerLocation(advert.seller?.location);
	if (loc) result.location = loc;

	if (!result.engine) {
		const cc = parseIntSafe(param(advert, 'engine_capacity')?.value);
		const text = [advert.title, result.title, stripHtml(advert.description)].filter(Boolean).join(' ');
		result.engine = guessEngine(text, cc);
	}
}

/**
 * "Vila do Conde, Porto" — municipality (concelho) first, then district. StandVirtual's `city` is
 * usually a parish, so the municipality is read from the tail of `shortAddress`
 * ("… 4450-120 Matosinhos e Leça da Palmeira, Matosinhos (Portugal)" / "…, concelho Guimarães (Portugal)").
 */
function sellerLocation(loc: SellerLocation | undefined): string | undefined {
	if (!loc) return undefined;
	let municipality: string | undefined;
	if (loc.shortAddress) {
		const tail = loc.shortAddress.split(',').pop() ?? '';
		municipality =
			tail
				.replace(/\(\s*portugal\s*\)/i, '')
				.replace(/^\s*concelho\s+(de\s+)?/i, '')
				.trim() || undefined;
		// No comma → the tail is the whole address, not a municipality.
		if (!loc.shortAddress.includes(',')) municipality = undefined;
	}
	municipality ??= loc.city?.trim() || undefined;
	const region = loc.region?.trim() || undefined;
	if (municipality && region && municipality.toLowerCase() !== region.toLowerCase()) {
		return `${municipality}, ${region}`;
	}
	return municipality || region;
}

function stripHtml(s: string | undefined): string {
	return (s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

/** Engine family tokens as they appear in listings (hyphen-optional); canonical casing comes from ENGINE_CODES. */
const ENGINE_FAMILIES = [
	'tce', 'dci', 'tdi', 'tsi', 'tfsi', 'fsi', 'hdi', 'e-hdi', 'bluehdi', 'puretech', 'vti', 'thp',
	'cdti', 'crdi', 'tdci', 'ecoboost', 'multijet', 'jtd', 'jtdm', 'd-4-d', 'd-4d', 'vvt-i', 'cvvt',
	'cdi', 'i-vtec', 'i-dtec', 'ddis', 'gdi', 't-gdi', 'ecotec', 'mz-cd', 'sce', 'mpi', 'skyactiv'
];
const FAMILY_ALT = [...ENGINE_FAMILIES]
	.sort((a, b) => b.length - a.length)
	.map((f) => f.replace(/-/g, '[- ]?'))
	.join('|');
const DISP_FAMILY_RE = new RegExp(`\\b([0-6][.,]\\d)\\s*(${FAMILY_ALT})\\b`, 'i');
const FAMILY_RE = new RegExp(`\\b(${FAMILY_ALT})\\b`, 'i');

function canonicalFamily(raw: string): string {
	return normalizeEngine(raw.replace(/\s+/g, '-'));
}

/**
 * Best-effort engine label like "1.5 dCi": an explicit "1.5 dCi" in the title/description wins;
 * otherwise a bare family ("TCe 140") is combined with the listed displacement; otherwise just the
 * displacement ("1.2").
 */
export function guessEngine(text: string, cc: number | undefined): string | undefined {
	const disp = cc && cc >= 500 && cc <= 7000 ? (Math.round(cc / 100) / 10).toFixed(1) : undefined;
	const full = text.match(DISP_FAMILY_RE);
	if (full) return `${full[1].replace(',', '.')} ${canonicalFamily(full[2])}`;
	const fam = text.match(FAMILY_RE);
	if (fam && disp) return `${disp} ${canonicalFamily(fam[1])}`;
	return disp;
}
