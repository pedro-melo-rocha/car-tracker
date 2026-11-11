import { redirect } from '@sveltejs/kit';

// Compare now opens as an overlay from the list or a car's page.
export const load = () => {
	throw redirect(308, '/list');
};
