import type { Handle } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase-auth';
import { rateLimit } from '$lib/server/rate-limit';

export const handle: Handle = async ({ event, resolve }) => {
	const supabase = createSupabaseServerClient(event);
	const {
		data: { user }
	} = await supabase.auth.getUser();

	event.locals.supabase = supabase;
	event.locals.user = user;

	if (event.url.pathname.startsWith('/api/')) {
		if (!user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		const rlResp = rateLimit(event);
		if (rlResp) return rlResp;
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
