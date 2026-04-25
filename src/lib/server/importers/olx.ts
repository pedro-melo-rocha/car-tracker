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

export function parseOlx(html: string, url: string): Partial<CarCreateInput> {
	const $ = load(html);
	const result: Partial<CarCreateInput> = { url, source: 'OLX' };

	const blobs = extractJsonLd($);
	const product = findJsonLdType(blobs, ['Product', 'Vehicle', 'Car']);
	if (product) {
		if (typeof product.name === 'string') result.title = product.name.trim();
		if (typeof product.image === 'string') result.imageUrl = product.image;
		else if (Array.isArray(product.image) && typeof product.image[0] === 'string') {
			result.imageUrl = product.image[0];
		}
		const offers = product.offers as { price?: unknown } | undefined;
		if (offers && typeof offers === 'object') {
			const p = parseIntSafe(offers.price as string | number);
			if (p) result.price = p;
		}
	}

	if (!result.title) {
		result.title = metaContent($, 'meta[property="og:title"]') || $('h1').first().text().trim() || undefined;
	}
	if (!result.imageUrl) {
		result.imageUrl = metaContent($, 'meta[property="og:image"]');
	}
	if (!result.price) {
		const priceMeta = metaContent($, 'meta[property="product:price:amount"]');
		if (priceMeta) result.price = parseIntSafe(priceMeta);
	}

	$('li, p, div').each((_, el) => {
		const text = $(el).text().trim();
		if (!text || text.length > 160) return;

		const kv = text.match(/^(.+?):\s*(.+)$/);
		if (kv) {
			const k = kv[1].toLowerCase();
			const v = kv[2].trim();
			if (!result.year && /ano/.test(k)) result.year = parseIntSafe(v);
			if (!result.km && /quilómetros|quilometros|km/.test(k)) result.km = parseIntSafe(v);
			if (!result.fuel && /combustível|combustivel/.test(k)) result.fuel = normalizeFuel(v);
			if (!result.make && /marca/.test(k)) result.make = normalizeMakeOrUndef(v);
			if (!result.model && /modelo/.test(k)) result.model = v;
			if (!result.power && /potência|potencia/.test(k)) result.power = parseIntSafe(v);
			if (!result.engine && /cilindrada/.test(k)) {
				const cc = parseIntSafe(v);
				if (cc && cc > 500) result.engine = `${(cc / 1000).toFixed(1)}`;
			}
		}
	});

	return result;
}
