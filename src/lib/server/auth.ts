import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export function requireSecret(event: RequestEvent): Response | null {
	const expected = env.API_SECRET;
	if (!expected) {
		return json({ error: 'API_SECRET not configured' }, { status: 500 });
	}
	const got = event.request.headers.get('x-api-secret');
	if (got !== expected) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	return null;
}
