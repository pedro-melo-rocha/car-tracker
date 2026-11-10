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

	it('flags the Yaris 1.4 D-4D scam via reliability-aware market floor', () => {
		const r = detectScamRisk(
			fixture({
				make: 'Toyota',
				model: 'Yaris',
				year: 2012,
				km: 176500,
				price: 4500,
				engine: '1.4 D-4D',
				source: 'PiscaPisca'
			}),
			NOW
		);
		expect(r.flags.map((f) => f.id)).toContain('below-market-estimate');
		expect(r.level).not.toBe('none');
	});

	it('flags below-peer-median when similar tracked cars are priced much higher', () => {
		const peers: Car[] = [
			fixture({ id: 'p1', make: 'Toyota', model: 'Yaris', year: 2012, km: 170000, price: 9800 }),
			fixture({ id: 'p2', make: 'Toyota', model: 'Yaris', year: 2013, km: 180000, price: 10500 }),
			fixture({ id: 'p3', make: 'toyota', model: 'yaris', year: 2011, km: 160000, price: 9500 })
		];
		const r = detectScamRisk(
			fixture({
				id: 'target',
				make: 'Toyota',
				model: 'Yaris',
				year: 2012,
				km: 176500,
				price: 4500
			}),
			{ peers, now: NOW }
		);
		expect(r.flags.map((f) => f.id)).toContain('below-peer-median');
	});

	it('does not flag below-peer-median with fewer than 3 peers', () => {
		const peers: Car[] = [
			fixture({ id: 'p1', make: 'Toyota', model: 'Yaris', year: 2012, km: 170000, price: 9800 }),
			fixture({ id: 'p2', make: 'Toyota', model: 'Yaris', year: 2013, km: 180000, price: 10500 })
		];
		const r = detectScamRisk(
			fixture({
				id: 'target',
				make: 'Toyota',
				model: 'Yaris',
				year: 2012,
				km: 176500,
				price: 4500
			}),
			{ peers, now: NOW }
		);
		expect(r.flags.map((f) => f.id)).not.toContain('below-peer-median');
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

describe('detectScamRisk — seller and listing signals', () => {
	const fair = { year: 2012, km: 160000, price: 4500, make: 'Renault', model: 'Clio', engine: '1.5 dCi' };
	const ids = (r: ReturnType<typeof detectScamRisk>) => r.flags.map((f) => f.id);

	it('flags a new private seller account', () => {
		const r = detectScamRisk(fixture({ ...fair, sellerSince: 2026, sellerType: 'private' }), NOW);
		expect(ids(r)).toContain('new-account');
		expect(r.flags.find((f) => f.id === 'new-account')!.weight).toBe(2);
		expect(r.level).toBe('low');
	});

	it('does not flag an established account', () => {
		const r = detectScamRisk(fixture({ ...fair, sellerSince: 2016, sellerType: 'private' }), NOW);
		expect(ids(r)).not.toContain('new-account');
	});

	it('escalates a new account with a suspicious price to high', () => {
		const r = detectScamRisk(
			fixture({ year: 2019, km: 150000, price: 2500, sellerSince: 2026, sellerType: 'private' }),
			NOW
		);
		expect(ids(r)).toContain('new-account-cheap');
		expect(r.level).toBe('high');
	});

	it('flags scam-script wording in the description', () => {
		const r = detectScamRisk(
			fixture({ ...fair, description: 'Estou emigrado na Suíça, envio o carro por transportadora.' }),
			NOW
		);
		const flag = r.flags.find((f) => f.id === 'scam-wording')!;
		expect(flag.weight).toBe(3);
		expect(flag.label).toContain('seller abroad');
		expect(flag.label).toContain('shipping by carrier');
	});

	it('treats pressure wording as a weak hint', () => {
		const r = detectScamRisk(fixture({ ...fair, description: 'Vendo urgente, contacto só por WhatsApp' }), NOW);
		expect(ids(r)).toContain('pressure-wording');
		expect(r.level).toBe('low');
	});

	it('flags imported cars with low km per year', () => {
		const r = detectScamRisk(fixture({ year: 2014, km: 90000, price: 4800, imported: true }), NOW);
		expect(ids(r)).toContain('imported-low-km');
	});

	it('flags listings with very few photos', () => {
		expect(ids(detectScamRisk(fixture({ ...fair, photoCount: 3 }), NOW))).toContain('few-photos');
		expect(ids(detectScamRisk(fixture({ ...fair, photoCount: 12 }), NOW))).not.toContain('few-photos');
	});

	it('flags cheap listings missing km or year (stored as 0)', () => {
		expect(ids(detectScamRisk(fixture({ price: 3000, km: 0, year: 2010 }), NOW))).toContain('missing-key-data');
	});

	it('sorts flags by weight, strongest first', () => {
		const r = detectScamRisk(
			fixture({ ...fair, photoCount: 2, description: 'emigrado, pagamento antecipado' }),
			NOW
		);
		expect(r.flags[0].id).toBe('scam-wording');
	});
});
