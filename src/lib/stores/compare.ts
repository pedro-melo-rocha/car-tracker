import { writable, get } from 'svelte/store';
import { toast } from './ui';

const MAX_COMPARE = 5;

export const compareIds = writable<string[]>([]);

export function addToCompare(id: string): boolean {
	const current = get(compareIds);
	if (current.includes(id)) return true;
	if (current.length >= MAX_COMPARE) {
		toast.error(`You can compare up to ${MAX_COMPARE} cars at once`);
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

export const MAX_COMPARE_CARS = MAX_COMPARE;

/** Href for the current page with the compare overlay open on `ids`. */
export function compareHref(current: URL, ids: string[]): string {
	const url = new URL(current);
	url.searchParams.delete('car');
	url.searchParams.set('compare', ids.slice(0, MAX_COMPARE).join(','));
	return url.pathname + url.search;
}

export function parseCompareParam(value: string | null): string[] {
	if (!value) return [];
	return value.split(',').filter(Boolean).slice(0, MAX_COMPARE);
}
