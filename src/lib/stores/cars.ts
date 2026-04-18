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

export async function deleteCar(id: string): Promise<void> {
	await apiFetch(`/api/cars/${id}`, { method: 'DELETE' });
	cars.update((list) => list.filter((c) => c.id !== id));
	toast.success('Car deleted');
}

export function getCar(id: string): Car | undefined {
	return get(cars).find((c) => c.id === id);
}
