import { randomUUID } from 'node:crypto';
import { json, error as kitError, type RequestHandler } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import { applyStaleness } from '$lib/staleness';
import { carCreateSchema, formatZodError } from '$lib/validation';

function serverError(scope: string, err: unknown): Response {
	console.error(`[cars] ${scope}:`, err);
	return json({ error: 'Internal error' }, { status: 500 });
}

export const GET: RequestHandler = async () => {
	const { data: cars, error } = await supabase
		.from('cars')
		.select('*')
		.order('addedAt', { ascending: false });

	if (error) return serverError('list', error);
	if (!cars) return json([]);

	const changed = applyStaleness(cars);
	if (changed.length > 0) {
		await Promise.all(
			changed.map((c) =>
				supabase
					.from('cars')
					.update({ status: c.status })
					.eq('id', c.id)
					.eq('status', c.previousStatus)
			)
		);
	}

	return json(cars);
};

export const POST: RequestHandler = async ({ request }) => {
	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		raw = {};
	}
	const parsed = carCreateSchema.safeParse(raw ?? {});
	if (!parsed.success) {
		return json(
			{ error: 'Invalid input', issues: formatZodError(parsed.error) },
			{ status: 400 }
		);
	}

	const body = parsed.data;
	const now = new Date().toISOString();
	const status = body.status || 'to-contact';
	const price = body.price ?? 0;

	const car = {
		id: randomUUID(),
		addedAt: now,
		url: body.url || '',
		title: body.title,
		make: body.make || '',
		model: body.model || '',
		year: body.year ?? 0,
		km: body.km ?? 0,
		price,
		fuel: body.fuel || '',
		engine: body.engine || '',
		power: body.power ?? 0,
		source: body.source || '',
		status,
		location: body.location || '',
		contactedAt: status === 'contacted' ? now : null,
		notes: body.notes || '',
		imageUrl: body.imageUrl || '',
		priceHistory: [{ date: now, price, note: 'Initial price' }],
		version: 1
	};

	const { data, error: insertErr } = await supabase.from('cars').insert(car).select().single();

	if (insertErr) return serverError('insert', insertErr);
	return json(data, { status: 201 });
};
