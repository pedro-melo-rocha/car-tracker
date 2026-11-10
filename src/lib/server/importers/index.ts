import type { CarCreateInput } from '$lib/types';
import { parseStandVirtual } from './standvirtual';
import { parseOlx } from './olx';
import { parsePiscaPisca } from './piscapisca';
import { parseCustoJusto } from './custojusto';
import { enrichFromTitle } from './utils';
import { buildTitle, isAutoTitle, normalizeListingUrl } from '$lib/listing';

export interface ImportResult {
	data: Partial<CarCreateInput>;
	source: string | null;
	warnings: string[];
}

type Parser = (html: string, url: string) => Partial<CarCreateInput>;

const PARSERS: Array<{ match: (host: string) => boolean; source: string; parse: Parser }> = [
	{ match: (h) => h.includes('standvirtual.com'), source: 'StandVirtual', parse: parseStandVirtual },
	{ match: (h) => h.includes('olx.pt'), source: 'OLX', parse: parseOlx },
	{ match: (h) => h.includes('piscapisca.pt'), source: 'PiscaPisca', parse: parsePiscaPisca },
	{ match: (h) => h.includes('custojusto.pt'), source: 'CustoJusto', parse: parseCustoJusto }
];

const USER_AGENT =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export async function importListing(url: string): Promise<ImportResult> {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new ImportError(400, 'Invalid URL');
	}

	const host = parsed.hostname.toLowerCase();
	const matched = PARSERS.find((p) => p.match(host));
	if (!matched) {
		throw new ImportError(422, `No importer for ${host}`);
	}

	const res = await fetch(url, {
		headers: {
			'user-agent': USER_AGENT,
			accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'accept-language': 'pt-PT,pt;q=0.9,en;q=0.8'
		},
		redirect: 'follow'
	});

	if (!res.ok) {
		throw new ImportError(
			res.status === 403 || res.status === 429 ? 502 : 502,
			`Listing fetch failed (${res.status})`
		);
	}

	const html = await res.text();
	const data = matched.parse(html, url);
	enrichFromTitle(data);
	if (data.url) data.url = normalizeListingUrl(data.url);
	if (isAutoTitle(data.title)) data.title = buildTitle(data, data.title);
	const warnings = missingFields(data);

	return { data, source: matched.source, warnings };
}

const IMPORTANT_FIELDS: Array<keyof CarCreateInput> = [
	'title',
	'price',
	'km',
	'year',
	'fuel',
	'make',
	'model'
];

function missingFields(data: Partial<CarCreateInput>): string[] {
	return IMPORTANT_FIELDS.filter((f) => {
		const v = data[f];
		return v === undefined || v === null || v === '';
	});
}

export class ImportError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}
