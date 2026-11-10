/** Hosts whose listing id lives in the path, so the query string is only tracking noise. */
const CLEAN_HOSTS = [
	'standvirtual.com',
	'olx.pt',
	'facebook.com',
	'piscapisca.pt',
	'custojusto.pt',
	'autoscout24.pt',
	'auto.pt'
];

/**
 * Strips tracking query/hash (`?au_advert_id=…&utm_…`, `?referralSurface=…`) from known listing
 * hosts so the same ad pasted twice compares equal. Unknown hosts and invalid URLs pass through.
 */
export function normalizeListingUrl(raw: string | null | undefined): string {
	const s = (raw ?? '').trim();
	if (!s) return '';
	let u: URL;
	try {
		u = new URL(s);
	} catch {
		return s;
	}
	const host = u.hostname.toLowerCase();
	if (!CLEAN_HOSTS.some((h) => host === h || host.endsWith('.' + h))) return s;
	u.search = '';
	u.hash = '';
	return u.toString();
}

/** "VW Golf 2004 - 4 000 EUR, 99 999 km" — StandVirtual's og:title, which goes stale when the price changes. */
const AUTO_TITLE_RE = /\s+-\s+[\d\s.,]+\s*EUR,\s*[\d\s.,]+\s*km\s*$/i;

export function isAutoTitle(title: string | null | undefined): boolean {
	return !!title && AUTO_TITLE_RE.test(title);
}

/**
 * "Mazda 3 Hatchback 1.6 MZ-CD 2006". Used instead of listing titles that embed price/km.
 * Falls back to the original title (minus the price/km suffix) when make/model are unknown.
 */
export function buildTitle(
	car: { make?: string | null; model?: string | null; engine?: string | null; year?: number | null },
	fallback = ''
): string {
	const base = fallback.replace(AUTO_TITLE_RE, '').trim();
	if (!car.make || !car.model) return base;
	// Some engine labels carry the make ("Honda i-VTEC"); don't repeat it.
	const engine = (car.engine ?? '').replace(new RegExp(`^${escapeRe(car.make)}\\s+`, 'i'), '');
	const parts = [car.make, car.model, engine, car.year ? String(car.year) : '']
		.map((p) => (p ?? '').trim())
		.filter(Boolean);
	return parts.join(' ').replace(/\s+/g, ' ');
}

function escapeRe(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
