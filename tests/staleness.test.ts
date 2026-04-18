import { describe, it, expect } from 'vitest';
import { applyStaleness, STALE_AFTER_DAYS } from '../src/lib/staleness';

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDaysAgo(days: number, now: number = Date.now()): string {
	return new Date(now - days * DAY_MS).toISOString();
}

describe('applyStaleness', () => {
	it('returns empty list for fresh-contacted cars', () => {
		const now = Date.now();
		const cars = [
			{ id: '1', status: 'contacted' as const, contactedAt: isoDaysAgo(0, now) },
			{ id: '2', status: 'contacted' as const, contactedAt: isoDaysAgo(1, now) },
			{ id: '3', status: 'contacted' as const, contactedAt: isoDaysAgo(2, now) }
		];
		expect(applyStaleness(cars, now)).toEqual([]);
		expect(cars.every((c) => c.status === 'contacted')).toBe(true);
	});

	it('flips to dismissed at the staleness threshold', () => {
		const now = Date.now();
		const cars = [
			{ id: '1', status: 'contacted' as const, contactedAt: isoDaysAgo(STALE_AFTER_DAYS, now) }
		];
		const changed = applyStaleness(cars, now);
		expect(changed).toEqual([{ id: '1', status: 'dismissed', previousStatus: 'contacted' }]);
		expect(cars[0].status).toBe('dismissed');
	});

	it('leaves non-contacted statuses alone even when old', () => {
		const now = Date.now();
		const cars = [
			{ id: '1', status: 'to-contact' as const, contactedAt: null },
			{ id: '2', status: 'negotiating' as const, contactedAt: isoDaysAgo(30, now) },
			{ id: '3', status: 'final-offer' as const, contactedAt: isoDaysAgo(30, now) },
			{ id: '4', status: 'dismissed' as const, contactedAt: isoDaysAgo(30, now) }
		];
		expect(applyStaleness(cars, now)).toEqual([]);
	});

	it('migrates legacy sem-resposta and inativo statuses to dismissed', () => {
		const now = Date.now();
		const cars = [
			{ id: '1', status: 'sem-resposta', contactedAt: isoDaysAgo(10, now) },
			{ id: '2', status: 'inativo', contactedAt: null }
		];
		const changed = applyStaleness(cars, now);
		expect(changed).toHaveLength(2);
		expect(cars.map((c) => c.status)).toEqual(['dismissed', 'dismissed']);
		expect(changed[0].previousStatus).toBe('sem-resposta');
		expect(changed[1].previousStatus).toBe('inativo');
	});

	it('migrates legacy bought to final-offer', () => {
		const cars = [{ id: '1', status: 'bought', contactedAt: null }];
		const changed = applyStaleness(cars, Date.now());
		expect(changed).toEqual([{ id: '1', status: 'final-offer', previousStatus: 'bought' }]);
	});

	it('migrates legacy rejected to dismissed', () => {
		const cars = [{ id: '1', status: 'rejected', contactedAt: null }];
		const changed = applyStaleness(cars, Date.now());
		expect(changed).toEqual([{ id: '1', status: 'dismissed', previousStatus: 'rejected' }]);
	});

	it('ignores cars without contactedAt', () => {
		const now = Date.now();
		const cars = [{ id: '1', status: 'contacted' as const, contactedAt: null }];
		expect(applyStaleness(cars, now)).toEqual([]);
		expect(cars[0].status).toBe('contacted');
	});
});
