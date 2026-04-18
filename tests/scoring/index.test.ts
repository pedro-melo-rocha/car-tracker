import { describe, it, expect } from 'vitest';
import { computeScoreBreakdown } from '../../src/lib/scoring';
import type { Car } from '../../src/lib/types';

// Baseline fixtures captured from live Supabase data on 2026-04-18.
// Any drift here means the scoring algorithm changed — investigate before updating.

function fixture(overrides: Partial<Car>): Car {
	return {
		id: 'fixture',
		title: 'fixture',
		status: 'to-contact',
		version: 1,
		addedAt: '2026-01-01T00:00:00.000Z',
		priceHistory: [],
		...overrides
	} as Car;
}

describe('computeScoreBreakdown — baseline parity', () => {
	it('[high] Peugeot 307 2.0 XSi-Automat 2006', () => {
		const car = fixture({
			id: '1776328897125',
			title: 'Peugeot 307 2.0 XSi-Automat 2006',
			make: 'Peugeot',
			engine: '2.0 XSi-Automat',
			year: 2006,
			km: 100000,
			price: 2850,
			fuel: 'Diesel',
			location: 'Braga'
		});
		const b = computeScoreBreakdown(car);
		expect(b.total).toBe(71);
		expect(b.km).toBe(100);
		expect(b.price).toBe(86);
		expect(b.year).toBe(7);
		expect(b.loc).toBe(98);
		expect(b.rel.score).toBe(54);
		expect(b.rel.base).toBe(54);
		expect(b.rel.delta).toBe(0);
	});

	it('[mid] VW Polo 1.2 TDi Confortline', () => {
		const car = fixture({
			id: '1776103711578',
			title: 'VW Polo 1.2 TDi Confortline',
			make: 'VW',
			engine: null,
			year: 2011,
			km: 143224,
			price: 5000,
			fuel: 'Diesel',
			location: 'Ramalde, Porto'
		});
		const b = computeScoreBreakdown(car);
		expect(b.total).toBe(56);
		expect(b.km).toBe(91);
		expect(b.price).toBe(0);
		expect(b.year).toBe(40);
		expect(b.loc).toBe(96);
		expect(b.rel.score).toBe(62);
		expect(b.rel.base).toBe(66);
		expect(b.rel.delta).toBe(-4);
		expect(b.rel.reason).toContain('1.2 TDI');
	});

	it('[low] Opel Astra 1.3 CDTI Cosmo', () => {
		const car = fixture({
			id: '1776103711569',
			title: 'Opel Astra 1.3 CDTI Cosmo',
			make: 'Opel',
			engine: null,
			year: 2006,
			km: 160000,
			price: 4990,
			fuel: 'Diesel',
			location: 'Loures, Lisboa'
		});
		const b = computeScoreBreakdown(car);
		expect(b.total).toBe(42);
		expect(b.km).toBe(80);
		expect(b.price).toBe(0);
		expect(b.year).toBe(7);
		expect(b.loc).toBe(81);
		expect(b.rel.score).toBe(42);
		expect(b.rel.base).toBe(58);
		expect(b.rel.delta).toBe(-16);
		expect(b.rel.reason).toContain('1.3 Multijet');
	});
});
