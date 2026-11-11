import { redirect } from '@sveltejs/kit';

// The score sandbox moved into each car's page ("What if") and the add form's live score.
export const load = () => {
	throw redirect(308, '/docs');
};
