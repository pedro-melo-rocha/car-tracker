import type { Car, CarStatus } from './types';

export const STALE_AFTER_DAYS = 3;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface StatusChange {
	id: string;
	status: CarStatus;
	previousStatus: string;
}

export interface Staleable {
	id: string;
	status: string;
	contactedAt?: string | null;
}

export function applyStaleness(cars: Staleable[], now: number = Date.now()): StatusChange[] {
	const changed: StatusChange[] = [];

	for (const car of cars) {
		const previousStatus = car.status;
		let dirty = false;

		if (['sem-resposta', 'inativo', 'inactive', 'rejected'].includes(car.status)) {
			car.status = 'dismissed';
			dirty = true;
		}

		if (car.status === 'bought') {
			car.status = 'final-offer';
			dirty = true;
		}

		if (car.contactedAt) {
			const contactedMs = new Date(car.contactedAt).getTime();
			const days = (now - contactedMs) / MS_PER_DAY;
			if (car.status === 'contacted' && days >= STALE_AFTER_DAYS) {
				car.status = 'dismissed';
				dirty = true;
			}
		}

		if (dirty) {
			changed.push({
				id: car.id,
				status: car.status as CarStatus,
				previousStatus
			});
		}
	}

	return changed;
}

export function timeAgo(iso: string | null | undefined, now: number = Date.now()): string {
	if (!iso) return '—';
	const diff = (now - new Date(iso).getTime()) / 1000;
	if (diff < 60) return 'just now';
	if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
	if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
	if (diff < 86400 * 7) return Math.floor(diff / 86400) + 'd ago';
	return Math.floor(diff / 86400 / 7) + 'w ago';
}
