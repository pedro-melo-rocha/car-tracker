import { browser } from '$app/environment';
import { refreshCars } from '$lib/stores/cars';

export const ssr = false;
export const prerender = false;

export const load = async () => {
	if (browser) {
		refreshCars().catch(() => {});
	}
	return {};
};
