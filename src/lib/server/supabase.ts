import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
	if (_client) return _client;
	const url = publicEnv.PUBLIC_SUPABASE_URL;
	const key = privateEnv.SUPABASE_SECRET_KEY;
	if (!url || !key) {
		throw new Error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY env var');
	}
	_client = createClient(url, key, { auth: { persistSession: false } });
	return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
	get(_, prop) {
		const target = getClient();
		const value = Reflect.get(target, prop);
		return typeof value === 'function' ? value.bind(target) : value;
	}
});
