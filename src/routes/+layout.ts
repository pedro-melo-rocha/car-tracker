import { browser } from '$app/environment';
import { refreshCars } from '$lib/stores/cars';

export const ssr = false;
export const prerender = false;

export const load = async ({ url }) => {
	if (browser && !url.pathname.startsWith('/share/')) {
		refreshCars().catch(() => {});
	}
	return {};
};
