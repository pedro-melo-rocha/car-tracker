import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

const PUBLIC_PATH_PREFIXES = ['/login', '/share', '/share-target', '/auth'];

function isPublic(pathname: string): boolean {
	return PUBLIC_PATH_PREFIXES.some(
		(p) => pathname === p || pathname.startsWith(p + '/')
	);
}

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user && !isPublic(url.pathname)) {
		const next = url.pathname + url.search;
		throw redirect(303, `/login?next=${encodeURIComponent(next)}`);
	}
	return {
		user: locals.user
			? { id: locals.user.id, email: locals.user.email ?? null }
			: null
	};
};
