import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function extractUrl(...candidates: (string | null)[]): string | null {
	for (const s of candidates) {
		if (!s) continue;
		const m = s.match(/https?:\/\/[^\s'"<>]+/i);
		if (m) return m[0];
	}
	return null;
}

export const GET: RequestHandler = async ({ url }) => {
	const params = url.searchParams;
	const found = extractUrl(params.get('url'), params.get('text'), params.get('title'));
	const target = new URL('/', url.origin);
	target.searchParams.set('edit', 'new');
	if (found) target.searchParams.set('importUrl', found);
	throw redirect(303, target.pathname + target.search);
};
