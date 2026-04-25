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

export function parsePiscaPisca(html: string, url: string): Partial<CarCreateInput> {
	const $ = load(html);
	const result: Partial<CarCreateInput> = { url, source: 'PiscaPisca' };

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
