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
		const r = detectScamRisk(fixture({ year: 2013, km: 55000, price: 3950 }), NOW);
		expect(r.flags.map((f) => f.id)).toContain('low-km-per-year');
	});

	it('does not flag low-km-per-year when usage is normal', () => {
		const r = detectScamRisk(fixture({ year: 2010, km: 180000, price: 4500 }), NOW);
		expect(r.flags.map((f) => f.id)).not.toContain('low-km-per-year');
	});

	it('flags recent cheap cars', () => {
		const r = detectScamRisk(fixture({ year: 2020, km: 120000, price: 2500 }), NOW);
		expect(r.flags.map((f) => f.id)).toContain('recent-cheap');
	});

	it('flags unicorn combos (low km + low price + recent)', () => {
		const r = detectScamRisk(fixture({ year: 2019, km: 50000, price: 2500 }), NOW);
		expect(r.flags.map((f) => f.id)).toContain('unicorn-combo');
	});

	it('flags the Peugeot 307 2.0 scam (older + 2.0L + too cheap)', () => {
		const r = detectScamRisk(
			fixture({
				year: 2006,
				km: 100000,
				price: 2850,
				engine: '2.0 XSi-Automat',
				source: 'StandVirtual'
			}),
			NOW
		);
		const ids = r.flags.map((f) => f.id);
		expect(ids).toContain('big-engine-cheap');
		expect(ids).toContain('low-km-per-year');
		expect(r.level).not.toBe('none');
	});

	it('flags a Leon-like below-market listing on StandVirtual', () => {
		const r = detectScamRisk(
			fixture({
				year: 2016,
				km: 120000,
				price: 6000,
				engine: '1.6 TDI',
				source: 'StandVirtual'
			}),
			NOW
		);
		expect(r.flags.map((f) => f.id)).toContain('below-market-estimate');
		expect(r.level).not.toBe('none');
	});

	it('does not flag a fairly-priced modern car regardless of source', () => {
		const r = detectScamRisk(
			fixture({
				year: 2018,
				km: 110000,
				price: 12000,
				engine: '1.6 TDI',
				source: 'OLX'
			}),
			NOW
		);
		expect(r.level).toBe('none');
	});
});
