import { writable, get } from 'svelte/store';
import type { Car, CarCreateInput, CarUpdateInput } from '../types';
import { apiFetch } from '../api';
import { toast } from './ui';

export const cars = writable<Car[]>([]);
export const carsLoading = writable<boolean>(true);
export const carsError = writable<string | null>(null);

export async function refreshCars(): Promise<void> {
	try {
		const list = await apiFetch<Car[]>('/api/cars');
		cars.set(list);
		carsError.set(null);
	} catch (err) {
		carsError.set(err instanceof Error ? err.message : String(err));
		throw err;
	} finally {
		carsLoading.set(false);
	}
}

export async function createCar(input: CarCreateInput): Promise<Car> {
	const created = await apiFetch<Car>('/api/cars', {
		method: 'POST',
		body: JSON.stringify(input)
	});
	cars.update((list) => [created, ...list]);
	toast.success('Car added');
	return created;
}

export async function updateCar(id: string, patch: CarUpdateInput): Promise<Car> {
	const current = get(cars).find((c) => c.id === id);
	const body: CarUpdateInput = current ? { ...patch, version: current.version } : patch;
	try {
		const updated = await apiFetch<Car>(`/api/cars/${id}`, {
			method: 'PUT',
			body: JSON.stringify(body)
		});
		cars.update((list) => list.map((c) => (c.id === id ? updated : c)));
		return updated;
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 409) {
			void refreshCars();
		}
		throw err;
	}
}

const UNDO_WINDOW_MS = 6000;

export function deleteCar(id: string): Promise<void> {
	const list = get(cars);
	const index = list.findIndex((c) => c.id === id);
	if (index < 0) return Promise.resolve();
	const snapshot = list[index];

	cars.update((l) => l.filter((c) => c.id !== id));

	let undone = false;

	toast.action(
		'Car deleted',
		{
			label: 'Undo',
			onClick: () => {
				undone = true;
				cars.update((l) => {
					if (l.some((c) => c.id === id)) return l;
					const next = [...l];
					next.splice(Math.min(index, next.length), 0, snapshot);
					return next;
				});
			}
		},
		UNDO_WINDOW_MS
	);

	setTimeout(async () => {
		if (undone) return;
		try {
			await apiFetch(`/api/cars/${id}`, { method: 'DELETE' });
		} catch {
			cars.update((l) => {
				if (l.some((c) => c.id === id)) return l;
				const next = [...l];
				next.splice(Math.min(index, next.length), 0, snapshot);
				return next;
			});
			toast.error('Failed to delete — restored');
		}
	}, UNDO_WINDOW_MS);

	return Promise.resolve();
}

export function getCar(id: string): Car | undefined {
	return get(cars).find((c) => c.id === id);
}
