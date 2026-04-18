import { describe, it, expect } from 'vitest';
import { kmSubscore } from '../../src/lib/scoring/km';

describe('kmSubscore', () => {
	it('returns neutral 50 when km is missing', () => {
		expect(kmSubscore({ km: null, fuel: null })).toBe(50);
		expect(kmSubscore({ km: undefined, fuel: null })).toBe(50);
	});

	it('gives 100 on the plateau for petrol (≤90k)', () => {
		expect(kmSubscore({ km: 0, fuel: 'Gasolina' })).toBe(50);
		expect(kmSubscore({ km: 50000, fuel: 'Gasolina' })).toBe(100);
		expect(kmSubscore({ km: 90000, fuel: 'Gasolina' })).toBe(100);
	});

	it('gives 100 on the plateau for diesel (≤130k)', () => {
		expect(kmSubscore({ km: 120000, fuel: 'Diesel' })).toBe(100);
		expect(kmSubscore({ km: 130000, fuel: 'Diesel' })).toBe(100);
	});

	it('decays to 0 at end-of-life', () => {
		expect(kmSubscore({ km: 200000, fuel: 'Gasolina' })).toBe(0);
		expect(kmSubscore({ km: 280000, fuel: 'Diesel' })).toBe(0);
		expect(kmSubscore({ km: 350000, fuel: 'Diesel' })).toBe(0);
	});

	it('interpolates linearly between plateau and end-of-life', () => {
		expect(kmSubscore({ km: 145000, fuel: 'Gasolina' })).toBe(50);
		expect(kmSubscore({ km: 205000, fuel: 'Diesel' })).toBe(50);
	});
});
