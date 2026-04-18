import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
	throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var');
}

export const supabase = createClient(url, key, {
	auth: { persistSession: false }
});
