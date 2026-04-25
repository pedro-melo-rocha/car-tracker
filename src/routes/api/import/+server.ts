import { json, type RequestHandler } from '@sveltejs/kit';
import { ImportError, importListing } from '$lib/server/importers';

export const POST: RequestHandler = async ({ request }) => {
	let body: { url?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const url = typeof body?.url === 'string' ? body.url.trim() : '';
	if (!url) return json({ error: 'Missing url' }, { status: 400 });
	if (url.length > 2000) return json({ error: 'URL too long' }, { status: 400 });

	try {
		const result = await importListing(url);
		return json(result);
	} catch (err) {
		if (err instanceof ImportError) {
			return json({ error: err.message }, { status: err.status });
		}
		console.error('[import] unexpected:', err);
		return json({ error: 'Import failed' }, { status: 500 });
	}
};
