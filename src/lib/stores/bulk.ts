import { writable, get } from 'svelte/store';
import type { Car, CarStatus } from '../types';
import { apiFetch } from '../api';
import { cars } from './cars';
import { toast } from './ui';

export const bulkSelection = writable<Set<string>>(new Set());

export function toggleSelection(id: string) {
	bulkSelection.update((s) => {
		const next = new Set(s);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		return next;
	});
}

export function setSelection(ids: Iterable<string>) {
	bulkSelection.set(new Set(ids));
}

export function clearSelection() {
	bulkSelection.set(new Set());
}

export function isSelected(id: string): boolean {
	return get(bulkSelection).has(id);
}

const UNDO_WINDOW_MS = 6000;

export async function bulkUpdateStatus(ids: string[], status: CarStatus): Promise<void> {
	if (ids.length === 0) return;
	const list = get(cars);
	const targets = ids
		.map((id) => list.find((c) => c.id === id))
		.filter((c): c is Car => Boolean(c) && c!.status !== status);
	if (targets.length === 0) {
		clearSelection();
		return;
	}

	const results = await Promise.allSettled(
		targets.map((c) =>
			apiFetch<Car>(`/api/cars/${c.id}`, {
				method: 'PUT',
				body: JSON.stringify({ status, version: c.version })
			})
		)
	);

	cars.update((current) => {
		const next = [...current];
		for (let i = 0; i < targets.length; i++) {
			const r = results[i];
			if (r.status !== 'fulfilled') continue;
			const idx = next.findIndex((x) => x.id === r.value.id);
			if (idx >= 0) next[idx] = r.value;
		}
		return next;
	});

	const ok = results.filter((r) => r.status === 'fulfilled').length;
	const failed = results.length - ok;
	if (failed === 0) {
		toast.success(`Updated ${ok} ${ok === 1 ? 'car' : 'cars'}`);
	} else if (ok === 0) {
		toast.error(`Failed to update ${failed} ${failed === 1 ? 'car' : 'cars'}`);
	} else {
		toast.error(`Updated ${ok}, ${failed} failed`);
	}
	clearSelection();
}

export function bulkDelete(ids: string[]): void {
	if (ids.length === 0) return;
	const list = get(cars);
	const snapshots = ids
		.map((id) => {
			const idx = list.findIndex((c) => c.id === id);
			return idx >= 0 ? { car: list[idx], index: idx } : null;
		})
		.filter((x): x is { car: Car; index: number } => x !== null);
	if (snapshots.length === 0) return;

	const removeIds = new Set(snapshots.map((s) => s.car.id));
	cars.update((l) => l.filter((c) => !removeIds.has(c.id)));
	clearSelection();

	let undone = false;
	const count = snapshots.length;

	toast.action(
		`${count} ${count === 1 ? 'car' : 'cars'} deleted`,
		{
			label: 'Undo',
			onClick: () => {
				undone = true;
				cars.update((l) => {
					const next = [...l];
					const sorted = [...snapshots].sort((a, b) => a.index - b.index);
					for (const s of sorted) {
						if (next.some((c) => c.id === s.car.id)) continue;
						next.splice(Math.min(s.index, next.length), 0, s.car);
					}
					return next;
				});
			}
		},
		UNDO_WINDOW_MS
	);

	setTimeout(async () => {
		if (undone) return;
		const results = await Promise.allSettled(
			snapshots.map((s) =>
				apiFetch(`/api/cars/${s.car.id}`, { method: 'DELETE' })
			)
		);
		const failed = results
			.map((r, i) => ({ r, snap: snapshots[i] }))
			.filter((x) => x.r.status !== 'fulfilled');
		if (failed.length === 0) return;

		cars.update((l) => {
			const next = [...l];
			const sorted = failed.map((x) => x.snap).sort((a, b) => a.index - b.index);
			for (const s of sorted) {
				if (next.some((c) => c.id === s.car.id)) continue;
				next.splice(Math.min(s.index, next.length), 0, s.car);
			}
			return next;
		});
		toast.error(`Couldn't delete ${failed.length} ${failed.length === 1 ? 'car' : 'cars'}. They're back in the list.`);
	}, UNDO_WINDOW_MS);
}

function csvEscape(value: unknown): string {
	if (value == null) return '';
	const s = String(value);
	if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

export function exportCarsToCsv(carsToExport: Car[]): string {
	const headers = [
		'id',
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
		'url',
		'addedAt',
		'contactedAt',
		'notes'
	];
	const rows = [headers.join(',')];
	for (const c of carsToExport) {
		rows.push(
			headers
				.map((h) => csvEscape((c as unknown as Record<string, unknown>)[h]))
				.join(',')
		);
	}
	return rows.join('\n');
}

export function downloadCsv(filename: string, content: string) {
	const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
