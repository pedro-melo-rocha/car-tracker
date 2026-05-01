import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestEvent } from '@sveltejs/kit';

export function createSupabaseServerClient(event: Pick<RequestEvent, 'cookies'>) {
	if (!publicEnv.PUBLIC_SUPABASE_URL || !publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
		throw new Error('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_PUBLISHABLE_KEY');
	}

	const cookies: CookieMethodsServer = {
		getAll: () => event.cookies.getAll(),
		setAll: (toSet) => {
			for (const { name, value, options } of toSet) {
				event.cookies.set(name, value, { ...options, path: '/' });
			}
		}
	};

	return createServerClient(
		publicEnv.PUBLIC_SUPABASE_URL,
		publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{ cookies }
	);
}
