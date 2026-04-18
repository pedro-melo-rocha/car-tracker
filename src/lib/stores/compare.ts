import { writable, get } from 'svelte/store';
import { toast } from './ui';

const MAX_COMPARE = 5;

export const compareIds = writable<string[]>([]);

export function addToCompare(id: string): boolean {
	const current = get(compareIds);
	if (current.includes(id)) return true;
	if (current.length >= MAX_COMPARE) {
		toast.error(`Compare is limited to ${MAX_COMPARE} cars`);
		return false;
	}
	compareIds.set([...current, id]);
	return true;
}

export function removeFromCompare(id: string): void {
	compareIds.update((list) => list.filter((x) => x !== id));
}

export function toggleCompare(id: string): void {
	const current = get(compareIds);
	if (current.includes(id)) removeFromCompare(id);
	else addToCompare(id);
}

export function clearCompare(): void {
	compareIds.set([]);
}
