import { json, type RequestHandler } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import { carUpdateSchema, formatZodError } from '$lib/validation';

const EDITABLE_FIELDS = [
	'url',
	'title',
	'make',
	'model',
	'year',
	'km',
	'price',
	'fuel',
	'engine',
	'power',
	'source',
	'status',
	'location',
	'notes',
	'imageUrl'
] as const;

function serverError(scope: string, err: unknown): Response {
	console.error(`[cars/[id]] ${scope}:`, err);
	return json({ error: 'Internal error' }, { status: 500 });
}

export const PUT: RequestHandler = async ({ params, request }) => {
	const { id } = params;
	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		raw = {};
	}
	const parsed = carUpdateSchema.safeParse(raw ?? {});
	if (!parsed.success) {
		return json(
			{ error: 'Invalid input', issues: formatZodError(parsed.error) },
			{ status: 400 }
		);
	}
	const body = parsed.data;

	const { data: existing, error: fetchErr } = await supabase
		.from('cars')
		.select('*')
		.eq('id', id)
		.maybeSingle();

	if (fetchErr) return serverError('fetch', fetchErr);
	if (!existing) return json({ error: 'Not found' }, { status: 404 });

	if (typeof body.version === 'number' && body.version !== existing.version) {
		return json(
			{
				error: 'Version conflict — car was modified elsewhere. Reload and try again.',
				currentVersion: existing.version
			},
			{ status: 409 }
		);
	}

	const car: Record<string, unknown> = { ...existing };
	const newPrice = body.price !== undefined ? body.price : car.price;
	const priceNote = body.priceNote || '';

	if (newPrice !== car.price) {
		const history = Array.isArray(car.priceHistory) ? car.priceHistory : [];
		car.priceHistory = [
			...history,
			{
				date: new Date().toISOString(),
				price: newPrice,
				note: priceNote || `Price changed from €${car.price} to €${newPrice}`
			}
		];
	}

	for (const f of EDITABLE_FIELDS) {
		const v = (body as Record<string, unknown>)[f];
		if (v !== undefined) car[f] = v;
	}

	if (body.status === 'contacted' && existing.status !== 'contacted') {
		car.contactedAt = new Date().toISOString();
	}
	if (body.status && !['contacted', 'dismissed'].includes(body.status)) {
		car.contactedAt = null;
	}

	delete car.priceNote;
	car.version = ((existing.version as number | undefined) || 1) + 1;

	let q = supabase.from('cars').update(car).eq('id', id);
	if (typeof body.version === 'number') {
		q = q.eq('version', body.version);
	}
	const { data, error: updateErr } = await q.select().maybeSingle();

	if (updateErr) return serverError('update', updateErr);
	if (!data) {
		return json(
			{ error: 'Version conflict — car was modified elsewhere. Reload and try again.' },
			{ status: 409 }
		);
	}
	return json(data);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const { id } = params;
	const { error: delErr, count } = await supabase
		.from('cars')
		.delete({ count: 'exact' })
		.eq('id', id);

	if (delErr) return serverError('delete', delErr);
	if (count === 0) return json({ error: 'Not found' }, { status: 404 });
	return new Response(null, { status: 204 });
};
