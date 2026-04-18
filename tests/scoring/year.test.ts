import { describe, it, expect } from 'vitest';
import { yearSubscore } from '../../src/lib/scoring/year';

describe('yearSubscore', () => {
	it('returns neutral 50 for missing year', () => {
		expect(yearSubscore({ year: null })).toBe(50);
	});

	it('gives 0 at 2005 or earlier', () => {
		expect(yearSubscore({ year: 2005 })).toBe(0);
		expect(yearSubscore({ year: 2000 })).toBe(0);
	});

	it('gives 100 at 2020', () => {
		expect(yearSubscore({ year: 2020 })).toBe(100);
	});

	it('clamps to 100 for newer years', () => {
		expect(yearSubscore({ year: 2024 })).toBe(100);
	});

	it('interpolates linearly between 2005 and 2020', () => {
		expect(yearSubscore({ year: 2012 })).toBe(47);
		expect(yearSubscore({ year: 2015 })).toBe(67);
	});
});
