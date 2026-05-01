import { createBrowserClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';

if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
	throw new Error('Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_PUBLISHABLE_KEY');
}

export const supabaseBrowser = createBrowserClient(
	env.PUBLIC_SUPABASE_URL,
	env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
);
