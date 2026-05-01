import { browser } from '$app/environment';
import { refreshCars } from '$lib/stores/cars';
import type { LayoutLoad } from './$types';

export const prerender = false;

export const load: LayoutLoad = async ({ data, url }) => {
	if (
		browser &&
		data?.user &&
		!url.pathname.startsWith('/share/') &&
		!url.pathname.startsWith('/login')
	) {
		refreshCars().catch(() => {});
	}
	return data;
};
