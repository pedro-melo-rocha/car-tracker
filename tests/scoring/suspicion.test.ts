import { describe, it, expect } from 'vitest';
import { detectScamRisk } from '../../src/lib/scoring/suspicion';
import type { Car } from '../../src/lib/types';

const NOW = 2026;

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

describe('detectScamRisk', () => {
	it('returns none when year, km, and price are all missing', () => {
		const r = detectScamRisk(fixture({}), NOW);
		expect(r.level).toBe('none');
		expect(r.flags).toEqual([]);
	});

	it('returns none for a normal used car', () => {
		const r = detectScamRisk(
			fixture({ year: 2015, km: 180000, price: 4500, source: 'StandVirtual' }),
			NOW
		);
		expect(r.level).toBe('none');
	});

	it('flags low km per year (rollback suspicion)', () => {
		const r = detectScamRisk(fixture({ year: 2020, km: 20000, price: 9000 }), NOW);
		expect(r.flags.map((f) => f.id)).toContain('low-km-per-year');
		expect(r.level).toBe('low');
	});

	it('flags low-km-per-year regardless of age (older cars still suspicious)', () => {
		// 2013 Peugeot 208 with 55k km → ~4.2k km/yr, should flag even at 13 yrs old
		const r = detectScamRisk(fixture({ year: 2013, km: 55000, price: 3950 }), NOW);
		expect(r.flags.map((f) => f.id)).toContain('low-km-per-year');
	});

	it('does not flag low-km-per-year when usage is normal', () => {
		// 2010 car with ~180k km → ~11k km/yr, normal
		const r = detectScamRisk(fixture({ year: 2010, km: 180000, price: 4500 }), NOW);
		expect(r.flags.map((f) => f.id)).not.toContain('low-km-per-year');
	});

	it('flags recent cheap cars', () => {
		const r = detectScamRisk(fixture({ year: 2020, km: 120000, price: 2500 }), NOW);
		expect(r.flags.map((f) => f.id)).toContain('recent-cheap');
	});

	it('flags unicorn combos (low km + low price + recent)', () => {
		const r = detectScamRisk(fixture({ year: 2019, km: 50000, price: 2500 }), NOW);
		const ids = r.flags.map((f) => f.id);
		expect(ids).toContain('unicorn-combo');
	});

	it('bumps to high when source is non-paid and a structural flag fires', () => {
		const r = detectScamRisk(
			fixture({ year: 2020, km: 30000, price: 2500, source: 'Facebook Marketplace' }),
			NOW
		);
		// low-km-per-year + recent-cheap + unicorn-combo + non-paid-source = 4 flags → high
		expect(r.nonPaidSource).toBe(true);
		expect(r.flags.map((f) => f.id)).toContain('non-paid-source');
		expect(r.level).toBe('high');
	});

	it('does not add non-paid-source flag when no structural flags fired', () => {
		const r = detectScamRisk(
			fixture({ year: 2015, km: 180000, price: 4500, source: 'OLX' }),
			NOW
		);
		expect(r.flags.map((f) => f.id)).not.toContain('non-paid-source');
		expect(r.level).toBe('none');
	});

	it('StandVirtual does not trigger the non-paid-source bump', () => {
		const r = detectScamRisk(
			fixture({ year: 2020, km: 30000, price: 2500, source: 'StandVirtual' }),
			NOW
		);
		expect(r.nonPaidSource).toBe(false);
		expect(r.flags.map((f) => f.id)).not.toContain('non-paid-source');
	});
});
