import { describe, it, expect } from 'vitest';
import { priceSubscore } from '../../src/lib/scoring/price';

describe('priceSubscore', () => {
	it('returns neutral 50 when price is missing', () => {
		expect(priceSubscore({ price: null })).toBe(50);
		expect(priceSubscore({ price: undefined })).toBe(50);
	});

	it('scores neutral 50 at price 0 (treated as missing)', () => {
		expect(priceSubscore({ price: 0 })).toBe(50);
	});

	it('gives 100 up to €2500', () => {
		expect(priceSubscore({ price: 500 })).toBe(100);
		expect(priceSubscore({ price: 2500 })).toBe(100);
	});

	it('decays linearly to 0 at €5000', () => {
		expect(priceSubscore({ price: 3750 })).toBe(50);
		expect(priceSubscore({ price: 5000 })).toBe(0);
		expect(priceSubscore({ price: 7000 })).toBe(0);
	});
});
