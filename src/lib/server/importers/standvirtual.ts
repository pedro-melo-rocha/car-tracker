import { load } from 'cheerio';
import type { CarCreateInput } from '$lib/types';
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

	const locLabel = $('a[href*="/anuncios/"]').filter((_, el) => /distrito|localidade/i.test($(el).text())).first();
	if (locLabel.length) result.location = locLabel.text().trim();

	return result;
}
