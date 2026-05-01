import { writable, derived } from 'svelte/store';
import type { Car } from '../types';
import { cars } from './cars';
import { cachedScore } from '../scoring';

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
				const sc = cachedScore(c);
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
				av = cachedScore(a);
				bv = cachedScore(b);
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

// ---------- URL <-> filter sync ----------

const LIST_PARAM_KEYS = [
	'q',
	'src',
	'mk',
	'st',
	'fu',
	'yMin',
	'yMax',
	'kmMin',
	'kmMax',
	'pMin',
	'pMax',
	'sMin',
	'sMax',
	'sort',
	'dir'
] as const;

const PIPELINE_PARAM_KEYS = ['q', 'src', 'fu'] as const;

const VALID_SORT_FIELDS: ListSortField[] = [
	'addedAt',
	'title',
	'score',
	'price',
	'km',
	'year',
	'status'
];

function readNum(p: URLSearchParams, key: string): number | null {
	const v = p.get(key);
	if (v == null || v === '') return null;
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
}

function readCsv(p: URLSearchParams, key: string): string[] {
	const v = p.get(key);
	return v ? v.split(',').filter(Boolean) : [];
}

export function listStateFromParams(p: URLSearchParams): { filters: ListFilters; sort: ListSort } {
	const sortField = p.get('sort') as ListSortField | null;
	return {
		filters: {
			search: p.get('q') || '',
			sources: readCsv(p, 'src'),
			makes: readCsv(p, 'mk'),
			statuses: readCsv(p, 'st'),
			fuels: readCsv(p, 'fu'),
			yearMin: readNum(p, 'yMin'),
			yearMax: readNum(p, 'yMax'),
			kmMin: readNum(p, 'kmMin'),
			kmMax: readNum(p, 'kmMax'),
			priceMin: readNum(p, 'pMin'),
			priceMax: readNum(p, 'pMax'),
			scoreMin: readNum(p, 'sMin'),
			scoreMax: readNum(p, 'sMax')
		},
		sort: {
			field: sortField && VALID_SORT_FIELDS.includes(sortField) ? sortField : 'addedAt',
			asc: p.get('dir') === 'asc'
		}
	};
}

export function applyListStateToParams(
	p: URLSearchParams,
	f: ListFilters,
	s: ListSort
): URLSearchParams {
	const out = new URLSearchParams(p);
	for (const k of LIST_PARAM_KEYS) out.delete(k);
	if (f.search) out.set('q', f.search);
	if (f.sources.length) out.set('src', f.sources.join(','));
	if (f.makes.length) out.set('mk', f.makes.join(','));
	if (f.statuses.length) out.set('st', f.statuses.join(','));
	if (f.fuels.length) out.set('fu', f.fuels.join(','));
	if (f.yearMin != null) out.set('yMin', String(f.yearMin));
	if (f.yearMax != null) out.set('yMax', String(f.yearMax));
	if (f.kmMin != null) out.set('kmMin', String(f.kmMin));
	if (f.kmMax != null) out.set('kmMax', String(f.kmMax));
	if (f.priceMin != null) out.set('pMin', String(f.priceMin));
	if (f.priceMax != null) out.set('pMax', String(f.priceMax));
	if (f.scoreMin != null) out.set('sMin', String(f.scoreMin));
	if (f.scoreMax != null) out.set('sMax', String(f.scoreMax));
	if (s.field !== 'addedAt') out.set('sort', s.field);
	if (s.asc) out.set('dir', 'asc');
	return out;
}

export function listParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
	for (const k of LIST_PARAM_KEYS) {
		if ((a.get(k) ?? '') !== (b.get(k) ?? '')) return false;
	}
	return true;
}

export function pipelineStateFromParams(p: URLSearchParams): {
	search: string;
	source: string;
	fuel: string;
} {
	return {
		search: p.get('q') || '',
		source: p.get('src') || '',
		fuel: p.get('fu') || ''
	};
}

export function applyPipelineStateToParams(
	p: URLSearchParams,
	f: { search: string; source: string; fuel: string }
): URLSearchParams {
	const out = new URLSearchParams(p);
	for (const k of PIPELINE_PARAM_KEYS) out.delete(k);
	if (f.search) out.set('q', f.search);
	if (f.source) out.set('src', f.source);
	if (f.fuel) out.set('fu', f.fuel);
	return out;
}

export function pipelineParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
	for (const k of PIPELINE_PARAM_KEYS) {
		if ((a.get(k) ?? '') !== (b.get(k) ?? '')) return false;
	}
	return true;
}

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
