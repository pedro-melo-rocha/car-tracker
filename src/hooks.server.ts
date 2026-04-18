import type { Handle } from '@sveltejs/kit';
import { requireSecret } from '$lib/server/auth';
import { rateLimit } from '$lib/server/rate-limit';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/api/')) {
		const authResp = requireSecret(event);
		if (authResp) return authResp;
		const rlResp = rateLimit(event);
		if (rlResp) return rlResp;
	}
	return resolve(event);
};
