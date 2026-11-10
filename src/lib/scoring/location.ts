import { LOCATION_DISTANCES } from '../constants';
import { MUNICIPALITIES } from '../municipalities';

export function normalizeLoc(s: string | null | undefined): string {
	return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

/** normalizeLoc + punctuation (hyphens, dots, apostrophes) collapsed to single spaces, for whole-word matching. */
function matchKey(s: string | null | undefined): string {
	return normalizeLoc(s)
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

/**
 * Distance lookup keyed by matchKey: every mainland municipality, then the hand-tuned
 * LOCATION_DISTANCES on top (they win, so existing scores stay stable).
 */
const DISTANCE_BY_KEY: Map<string, number> = (() => {
	const m = new Map<string, number>();
	for (const [name, , km] of MUNICIPALITIES) m.set(matchKey(name), km);
	for (const [place, km] of Object.entries(LOCATION_DISTANCES)) m.set(matchKey(place), km);
	return m;
})();

/** Keys longest-first so "Viana do Alentejo" beats "Viana" and "Porto de Mós" beats "Porto". */
const KEYS_BY_LENGTH = [...DISTANCE_BY_KEY.keys()].sort((a, b) => b.length - a.length);

/** Canonical spelling (accents + casing) for municipality and district names. */
const CANONICAL_BY_KEY: Map<string, string> = (() => {
	const m = new Map<string, string>();
	for (const [name, district] of MUNICIPALITIES) {
		m.set(matchKey(name), name);
		m.set(matchKey(district), district);
	}
	return m;
})();

function splitParts(location: string): string[] {
	return location
		.split(/[,;/|()]|\s[-–—]\s/)
		.map((p) => p.trim())
		.filter(Boolean);
}

function lookupPart(part: string): number | null {
	const key = matchKey(part);
	if (!key) return null;
	const exact = DISTANCE_BY_KEY.get(key);
	if (exact !== undefined) return exact;
	const padded = ` ${key} `;
	for (const k of KEYS_BY_LENGTH) {
		if (padded.includes(` ${k} `)) return DISTANCE_BY_KEY.get(k)!;
	}
	return null;
}

/**
 * Road-distance estimate (km) from Viana do Castelo. Comma-separated parts are tried in order,
 * most specific first ("Vila do Conde, Porto" → Vila do Conde, not Porto).
 */
export function locationKm(location: string | null | undefined): number | null {
	if (!location) return null;
	for (const part of splitParts(location)) {
		const km = lookupPart(part);
		if (km !== null) return km;
	}
	return null;
}

export function locationScore(location: string | null | undefined): number {
	const dist = locationKm(location);
	return dist === null ? 50 : distanceToScore(dist);
}

function distanceToScore(dist: number): number {
	if (dist <= 50) return 100;
	if (dist <= 200) return Math.round(100 - ((dist - 50) / 150) * 30);
	return Math.max(40, Math.round(70 - ((dist - 200) / 400) * 30));
}

const SMALL_WORDS = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'a', 'o']);

function titleCase(s: string): string {
	return s
		.toLowerCase()
		.split(/\s+/)
		.map((word, i) =>
			word
				.split('-')
				.map((p, j) =>
					SMALL_WORDS.has(p) && (i > 0 || j > 0) ? p : p.charAt(0).toUpperCase() + p.slice(1)
				)
				.join('-')
		)
		.join(' ');
}

/**
 * Normalises casing/accents so "vila do conde", "VILA DO CONDE" and "Vila Do Conde" all store as
 * "Vila do Conde". Known municipalities/districts get their canonical spelling; anything else is
 * title-cased with Portuguese particles kept lowercase.
 */
export function formatLocation(raw: string | null | undefined): string {
	if (!raw) return '';
	return raw
		.split(',')
		.map((p) => p.replace(/\s+/g, ' ').trim())
		.filter(Boolean)
		.map((p) => CANONICAL_BY_KEY.get(matchKey(p)) ?? titleCase(p))
		.join(', ');
}
