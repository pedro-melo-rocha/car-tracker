import type { CheerioAPI } from 'cheerio';
import type { CarCreateInput } from '$lib/types';
import {
	DATALIST_MAKES,
	EXTRA_MAKES,
	FUEL_MAP,
	normalizeMake
} from '$lib/constants';

export function parseIntSafe(raw: string | number | null | undefined): number | undefined {
	if (raw === null || raw === undefined) return undefined;
	const s = typeof raw === 'number' ? String(raw) : raw;
	const digits = s.replace(/[^\d]/g, '');
	if (!digits) return undefined;
	const n = parseInt(digits, 10);
	return Number.isFinite(n) ? n : undefined;
}

export function normalizeFuel(raw: string | null | undefined): string | undefined {
	if (!raw) return undefined;
	const key = raw.toLowerCase().trim();
	for (const k in FUEL_MAP) {
		if (key.includes(k)) return FUEL_MAP[k];
	}
	return undefined;
}

export function normalizeMakeOrUndef(raw: string | null | undefined): string | undefined {
	if (!raw) return undefined;
	const m = normalizeMake(raw);
	return m || undefined;
}

export function extractJsonLd($: CheerioAPI): Record<string, unknown>[] {
	const blobs: Record<string, unknown>[] = [];
	$('script[type="application/ld+json"]').each((_, el) => {
		const raw = $(el).contents().text();
		if (!raw) return;
		try {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				for (const item of parsed) if (item && typeof item === 'object') blobs.push(item);
			} else if (parsed && typeof parsed === 'object') {
				blobs.push(parsed);
				const graph = (parsed as { '@graph'?: unknown })['@graph'];
				if (Array.isArray(graph)) {
					for (const item of graph) if (item && typeof item === 'object') blobs.push(item);
				}
			}
		} catch {
			/* ignore malformed JSON-LD */
		}
	});
	return blobs;
}

export function findJsonLdType(
	blobs: Record<string, unknown>[],
	types: string[]
): Record<string, unknown> | null {
	const wanted = new Set(types.map((t) => t.toLowerCase()));
	for (const blob of blobs) {
		const t = blob['@type'];
		if (typeof t === 'string' && wanted.has(t.toLowerCase())) return blob;
		if (Array.isArray(t) && t.some((x) => typeof x === 'string' && wanted.has(x.toLowerCase()))) {
			return blob;
		}
	}
	return null;
}

export function metaContent($: CheerioAPI, selector: string): string | undefined {
	const el = $(selector).first();
	if (!el.length) return undefined;
	const v = el.attr('content');
	return v ? v.trim() : undefined;
}

const MAKE_NAMES = [...DATALIST_MAKES, ...EXTRA_MAKES]
	.map((m) => m.replace(/[-\s]/g, '[-\\s]'))
	.sort((a, b) => b.length - a.length);
const MAKE_RE = new RegExp(`\\b(${MAKE_NAMES.join('|')})\\b`, 'i');

export function enrichFromTitle(data: Partial<CarCreateInput>): void {
	const title = data.title;
	if (!title) return;

	if (!data.year) {
		const m = title.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
		if (m) data.year = parseInt(m[1], 10);
	}

	if (!data.price) {
		const m = title.match(/(\d[\d\s.,]*)\s*(?:EUR|€)/i);
		if (m) data.price = parseIntSafe(m[1]);
	}

	if (!data.km) {
		const m = title.match(/(\d[\d\s.,]*)\s*Kms?\b/i);
		if (m) data.km = parseIntSafe(m[1]);
	}

	if (!data.power) {
		const m = title.match(/(\d{2,4})\s*CV\b/i);
		if (m) data.power = parseIntSafe(m[1]);
	}

	if (!data.fuel) {
		if (/\bdiesel\b/i.test(title)) data.fuel = 'Diesel';
		else if (/\b(gasolina|gasoline|petrol)\b/i.test(title)) data.fuel = 'Gasolina';
	}

	if (!data.make) {
		const m = title.match(MAKE_RE);
		if (m) data.make = normalizeMakeOrUndef(m[1]);
	}

	if (data.make && !data.model) {
		const escMake = data.make.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const m = title.match(new RegExp(`${escMake}\\s+([^\\-–—|]+)`, 'i'));
		if (m) {
			const stop = m[1].search(
				/\s+(?:19[5-9]\d|20[0-2]\d)\b|\s+\d[\d\s.,]*\s*(?:EUR|€|Kms?|CV)\b|,/i
			);
			const raw = (stop === -1 ? m[1] : m[1].slice(0, stop)).trim();
			const tokens = raw.split(/\s+/).filter(Boolean).slice(0, 3);
			if (tokens.length) data.model = tokens.join(' ');
		}
	}
}
