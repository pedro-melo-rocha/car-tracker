import { writable, derived } from 'svelte/store';
import type { Car } from '../types';
import { cars } from './cars';
import { computeScore } from '../scoring';

export type ListSortField = 'addedAt' | 'title' | 'score' | 'price' | 'km' | 'year' | 'status';

export interface ListSort {
	field: ListSortField;
	asc: boolean;
}

export interface ListFilters {
	search: string;
	sources: string[];
	makes: string[];
	statuses: string[];
	fuels: string[];
	yearMin: number | null;
	yearMax: number | null;
	kmMin: number | null;
	kmMax: number | null;
	priceMin: number | null;
	priceMax: number | null;
	scoreMin: number | null;
	scoreMax: number | null;
}

export const listSort = writable<ListSort>({ field: 'addedAt', asc: false });

const emptyFilters: ListFilters = {
	search: '',
	sources: [],
	makes: [],
	statuses: [],
	fuels: [],
	yearMin: null,
	yearMax: null,
	kmMin: null,
	kmMax: null,
	priceMin: null,
	priceMax: null,
	scoreMin: null,
	scoreMax: null
};

export const listFilters = writable<ListFilters>({ ...emptyFilters });

export function resetListFilters() {
	listFilters.set({ ...emptyFilters });
}

export const pipelineFilter = writable<{
	search: string;
	source: string;
	fuel: string;
}>({ search: '', source: '', fuel: '' });

function inRange(v: number | null | undefined, min: number | null, max: number | null): boolean {
	if (v == null) return min == null && max == null;
	if (min != null && v < min) return false;
	if (max != null && v > max) return false;
	return true;
}

export const filteredListCars = derived(
	[cars, listFilters, listSort],
	([$cars, $filters, $sort]) => {
		const hiddenStatuses = new Set(['dismissed']);
		const result = $cars
			.filter((c) => {
				if (hiddenStatuses.has(c.status) && !$filters.statuses.includes(c.status)) return false;
				if ($filters.sources.length && !$filters.sources.includes(c.source || '')) return false;
				if ($filters.makes.length && !$filters.makes.includes(c.make || '')) return false;
				if ($filters.statuses.length && !$filters.statuses.includes(c.status)) return false;
				if ($filters.fuels.length && !$filters.fuels.includes(c.fuel || '')) return false;
				if (!inRange(c.year ?? null, $filters.yearMin, $filters.yearMax)) return false;
				if (!inRange(c.km ?? null, $filters.kmMin, $filters.kmMax)) return false;
				if (!inRange(c.price ?? null, $filters.priceMin, $filters.priceMax)) return false;
				const sc = computeScore(c);
				if (!inRange(sc, $filters.scoreMin, $filters.scoreMax)) return false;
				if ($filters.search) {
					const q = $filters.search.toLowerCase();
					const hay = [c.title, c.make, c.model, c.notes].filter(Boolean).join(' ').toLowerCase();
					if (!hay.includes(q)) return false;
				}
				return true;
			})
			.slice();

		const { field, asc } = $sort;
		result.sort((a, b) => {
			let av: number | string;
			let bv: number | string;
			if (field === 'score') {
				av = computeScore(a);
				bv = computeScore(b);
			} else if (field === 'addedAt' || field === 'title' || field === 'status') {
				av = a[field] ?? '';
				bv = b[field] ?? '';
			} else {
				av = (a[field] as number) ?? 0;
				bv = (b[field] as number) ?? 0;
			}
			if (av < bv) return asc ? -1 : 1;
			if (av > bv) return asc ? 1 : -1;
			return 0;
		});

		return result;
	}
);

function matchesPipelineCar(
	c: Car,
	filter: { search: string; source: string; fuel: string }
): boolean {
	if (filter.source && c.source !== filter.source) return false;
	if (filter.fuel && c.fuel !== filter.fuel) return false;
	if (filter.search) {
		const q = filter.search.toLowerCase();
		const hay = [c.title, c.make, c.model, c.notes].filter(Boolean).join(' ').toLowerCase();
		if (!hay.includes(q)) return false;
	}
	return true;
}

export const filteredPipelineCars = derived(
	[cars, pipelineFilter],
	([$cars, $filter]) => $cars.filter((c) => matchesPipelineCar(c, $filter))
);
