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

export function parseCustoJusto(html: string, url: string): Partial<CarCreateInput> {
	const $ = load(html);
	const result: Partial<CarCreateInput> = { url, source: 'CustoJusto' };

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
	if (!result.imageUrl) result.imageUrl = metaContent($, 'meta[property="og:image"]');
	if (!result.price) {
		const priceMeta = metaContent($, 'meta[property="product:price:amount"]');
		if (priceMeta) result.price = parseIntSafe(priceMeta);
	}

	$('li, tr, p, dd, dt').each((_, el) => {
		const text = $(el).text().trim().replace(/\s+/g, ' ');
		if (!text || text.length > 200) return;

		const kv = text.match(/^(.+?):\s*(.+)$/);
		if (kv) {
			const k = kv[1].toLowerCase();
			const v = kv[2].trim();
			if (!result.year && /ano/.test(k)) result.year = parseIntSafe(v);
			if (!result.km && /(quil[oó]metros|km)/.test(k)) result.km = parseIntSafe(v);
			if (!result.fuel && /combust[ií]vel/.test(k)) result.fuel = normalizeFuel(v);
			if (!result.make && /marca/.test(k)) result.make = normalizeMakeOrUndef(v);
			if (!result.model && /modelo/.test(k)) result.model = v;
			if (!result.power && /pot[êe]ncia/.test(k)) result.power = parseIntSafe(v);
		} else {
			if (!result.km) {
				const m = text.match(/(\d[\d\s.,]*)\s*km/i);
				if (m) result.km = parseIntSafe(m[1]);
			}
			if (!result.year) {
				const m = text.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
				if (m) result.year = parseIntSafe(m[1]);
			}
		}
	});

	const locMeta = metaContent($, 'meta[property="og:locality"]');
	if (locMeta) result.location = locMeta;

	return result;
}
