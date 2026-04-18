import {
	SOURCE_MAP,
	ENGINE_CODES,
	ENGINE_CODE_RE,
	FUEL_MAP,
	LOCATION_DISTANCES,
	DATALIST_MAKES,
	EXTRA_MAKES
} from './constants';

export interface InferredFields {
	source?: string;
	make?: string;
	model?: string;
	year?: number;
	km?: number;
	price?: number;
	fuel?: string;
	engine?: string;
	power?: number;
	location?: string;
}

interface MakeEntry {
	canonical: string;
	parts: string[];
}

let _knownMakesCache: MakeEntry[] | null = null;
function getKnownMakes(): MakeEntry[] {
	if (_knownMakesCache) return _knownMakesCache;
	const all = [...DATALIST_MAKES, ...EXTRA_MAKES];
	const entries = all.map((m) => ({
		canonical: m,
		parts: m.toLowerCase().split(/[\s-]+/).filter(Boolean)
	}));
	entries.sort((a, b) => b.parts.length - a.parts.length);
	_knownMakesCache = entries;
	return entries;
}

let _locationKeysCache: { key: string; parts: string[] }[] | null = null;
function getLocationKeys() {
	if (_locationKeysCache) return _locationKeysCache;
	_locationKeysCache = Object.keys(LOCATION_DISTANCES)
		.map((k) => ({ key: k, parts: k.split(' ') }))
		.sort((a, b) => b.parts.length - a.parts.length);
	return _locationKeysCache;
}

export function tokenizeUrl(url: string): string[] {
	let s: string;
	try {
		s = decodeURIComponent(url);
	} catch {
		s = url;
	}
	s = s.toLowerCase().replace(/^https?:\/\/[^/]+/, '');
	return s.split(/[^a-z0-9.]+/).filter(Boolean);
}

function titleCaseToken(t: string): string {
	if (/^[ivx]+$/i.test(t)) return t.toUpperCase();
	return t.charAt(0).toUpperCase() + t.slice(1);
}

export function classifyTokens(tokens: string[]): InferredFields {
	const currentYear = new Date().getFullYear();
	const result: InferredFields = {};
	const consumed = new Array(tokens.length).fill(false);
	const claim = <K extends keyof InferredFields>(i: number, key: K, val: InferredFields[K]) => {
		if (result[key] == null) {
			result[key] = val;
			consumed[i] = true;
			return true;
		}
		return false;
	};

	for (let i = 0; i < tokens.length; i++) {
		if (consumed[i]) continue;
		const t = tokens[i];

		if (/^(19|20)\d{2}$/.test(t)) {
			const y = Number(t);
			if (y >= 1990 && y <= currentYear) {
				claim(i, 'year', y);
				continue;
			}
		}

		let m = t.match(/^(\d{2,4})(cv|hp|ps)$/);
		if (m) {
			claim(i, 'power', Number(m[1]));
			continue;
		}
		m = t.match(/^(\d{2,3})kw$/);
		if (m) {
			claim(i, 'power', Math.round(Number(m[1]) * 1.36));
			continue;
		}

		m = t.match(/^(\d{2,3})k$/);
		if (m) {
			claim(i, 'km', Number(m[1]) * 1000);
			continue;
		}
		m = t.match(/^(\d{4,6})km$/);
		if (m) {
			claim(i, 'km', Number(m[1]));
			continue;
		}

		m = t.match(/^(\d{3,6})eur?s?$/);
		if (m) {
			claim(i, 'price', Number(m[1]));
			continue;
		}

		if (FUEL_MAP[t]) {
			claim(i, 'fuel', FUEL_MAP[t]);
			continue;
		}

		if (/^[1-6]\.\d$/.test(t)) {
			if (result.engine == null) {
				const next = i + 1 < tokens.length ? tokens[i + 1] : null;
				const code = next && ENGINE_CODES[next] ? ENGINE_CODES[next] : null;
				result.engine = code ? `${t} ${code}` : t;
				consumed[i] = true;
				if (code) consumed[i + 1] = true;
			}
			continue;
		}
		m = t.match(/^([1-6])(\d)([a-z]+)$/);
		if (m && ENGINE_CODES[m[3]]) {
			if (result.engine == null) {
				result.engine = `${m[1]}.${m[2]} ${ENGINE_CODES[m[3]]}`;
				consumed[i] = true;
			}
			continue;
		}
		if (
			/^[1-6]$/.test(t) &&
			i + 2 < tokens.length &&
			/^\d$/.test(tokens[i + 1]) &&
			ENGINE_CODES[tokens[i + 2]]
		) {
			if (result.engine == null) {
				result.engine = `${t}.${tokens[i + 1]} ${ENGINE_CODES[tokens[i + 2]]}`;
				consumed[i] = consumed[i + 1] = consumed[i + 2] = true;
			}
			continue;
		}
	}

	for (let i = 0; i < tokens.length; i++) {
		if (consumed[i]) continue;
		if (/^\d+$/.test(tokens[i])) {
			const n = Number(tokens[i]);
			if (n >= 5000 && n <= 600000 && !(n >= 1990 && n <= currentYear)) {
				if (claim(i, 'km', n)) continue;
			}
		}
	}

	for (const { parts } of getLocationKeys()) {
		for (let i = 0; i <= tokens.length - parts.length; i++) {
			let hit = true;
			for (let k = 0; k < parts.length; k++) {
				if (consumed[i + k] || tokens[i + k] !== parts[k]) {
					hit = false;
					break;
				}
			}
			if (hit) {
				result.location = parts.map(titleCaseToken).join(' ');
				for (let k = 0; k < parts.length; k++) consumed[i + k] = true;
				break;
			}
		}
		if (result.location != null) break;
	}

	let makeIdx = -1;
	let makeLen = 0;
	for (const { parts, canonical } of getKnownMakes()) {
		for (let i = 0; i <= tokens.length - parts.length; i++) {
			let hit = true;
			for (let k = 0; k < parts.length; k++) {
				if (consumed[i + k] || tokens[i + k] !== parts[k]) {
					hit = false;
					break;
				}
			}
			if (hit) {
				result.make = canonical;
				for (let k = 0; k < parts.length; k++) consumed[i + k] = true;
				makeIdx = i;
				makeLen = parts.length;
				break;
			}
		}
		if (makeIdx >= 0) break;
	}

	if (makeIdx >= 0) {
		const modelParts: string[] = [];
		for (let i = makeIdx + makeLen; i < tokens.length && modelParts.length < 4; i++) {
			if (consumed[i]) break;
			const t = tokens[i];
			if (/^\d+$/.test(t) && t.length > 3) break;
			if (/^id\w*\d/.test(t)) break;
			if (ENGINE_CODE_RE.test(t)) break;
			modelParts.push(t);
			consumed[i] = true;
		}
		if (modelParts.length) result.model = modelParts.map(titleCaseToken).join(' ');
	}

	return result;
}

export function inferFromUrl(url: string): InferredFields | null {
	if (!url) return null;
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return null;
	}

	const hostname = parsed.hostname.replace(/^www\./, '');
	const inferred: InferredFields = {};
	const src = SOURCE_MAP[hostname];
	if (src) inferred.source = src;

	const tokens = tokenizeUrl(url);
	Object.assign(inferred, classifyTokens(tokens));

	return inferred;
}
