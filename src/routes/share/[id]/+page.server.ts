import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/server/supabase';
import type { PublicCar } from '$lib/types';

const PUBLIC_COLUMNS =
	'id,addedAt,url,title,make,model,year,km,price,fuel,engine,power,source,location,priceHistory,imageUrl';

export const load: PageServerLoad = async ({ params }) => {
	const { data, error: err } = await supabase
		.from('cars')
		.select(PUBLIC_COLUMNS)
		.eq('id', params.id)
		.maybeSingle();

	if (err) {
		console.error('[share] load:', err);
		throw error(500, 'Internal error');
	}
	if (!data) throw error(404, 'Car not found');

	return { car: data as unknown as PublicCar };
};
