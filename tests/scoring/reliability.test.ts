import { describe, it, expect } from 'vitest';
import {
	reliabilitySubscore,
	getMakeReliability,
	getEngineProfile
} from '../../src/lib/scoring/reliability';

describe('getMakeReliability', () => {
	it('defaults to 60 for unknown/missing make', () => {
		expect(getMakeReliability(null)).toBe(60);
		expect(getMakeReliability('Nonexistent Motor Co')).toBe(60);
	});

	it('returns the baseline for known makes', () => {
		expect(getMakeReliability('Toyota')).toBe(90);
		expect(getMakeReliability('BMW')).toBe(62);
		expect(getMakeReliability('Fiat')).toBe(48);
	});

	it('is case-insensitive', () => {
		expect(getMakeReliability('TOYOTA')).toBe(90);
		expect(getMakeReliability('toyota')).toBe(90);
	});
});

describe('getEngineProfile', () => {
	it('returns null when no engine data available', () => {
		expect(getEngineProfile({ title: '', notes: null, engine: null })).toBeNull();
	});

	it('matches the 1.3 Multijet pattern with a strong penalty', () => {
		const p = getEngineProfile({
			title: 'Fiat Punto 1.3 Multijet',
			notes: null,
			engine: null
		});
		expect(p).not.toBeNull();
		expect(p?.delta).toBe(-16);
	});

	it('matches the 1.9 TDI with a bonus', () => {
		const p = getEngineProfile({ title: 'Golf 1.9 TDI', notes: null, engine: null });
		expect(p?.delta).toBe(12);
	});

	it('catches 1.3 CDTi (Opel variant of the flagged Fiat block)', () => {
		const p = getEngineProfile({ title: 'Opel Corsa 1.3 CDTi', notes: null, engine: null });
		expect(p?.delta).toBe(-16);
	});

	it('distinguishes EA211 1.2 TSI (+5) from EA111 1.2 TSI (-10)', () => {
		const good = getEngineProfile({ title: 'Polo 1.2 TSI EA211', notes: null, engine: null, year: 2016 });
		const bad = getEngineProfile({ title: 'Polo 1.2 TSI', notes: null, engine: null, year: 2011 });
		expect(good?.delta).toBe(5);
		expect(bad?.delta).toBe(-10);
	});

	it('matches the 2.0 D-4D', () => {
		const p = getEngineProfile({ title: 'Toyota Avensis 2.0 D-4D', notes: null, engine: null });
		expect(p?.delta).toBe(10);
	});

	it('matches the 1.7 CDTi', () => {
		const p = getEngineProfile({ title: 'Opel Astra 1.7 CDTi', notes: null, engine: null });
		expect(p?.delta).toBe(6);
	});

	it('matches the 1.4 CRDi separately from 1.6 CRDi', () => {
		const p = getEngineProfile({ title: 'Hyundai i20 1.4 CRDi', notes: null, engine: null });
		expect(p?.delta).toBe(3);
	});

	it('matches 1.6 BlueHDi before the generic 1.6 HDi rule', () => {
		const p = getEngineProfile({ title: 'Peugeot 308 1.6 BlueHDi', notes: null, engine: null });
		expect(p?.delta).toBe(2);
	});

	it('flags 1.0 EcoBoost', () => {
		const p = getEngineProfile({ title: 'Ford Fiesta 1.0 EcoBoost', notes: null, engine: null });
		expect(p?.delta).toBe(-6);
	});

	it('flags Renault TCe variants', () => {
		const p09 = getEngineProfile({ title: 'Renault Clio 0.9 TCe', notes: null, engine: null });
		const p12 = getEngineProfile({ title: 'Renault Captur 1.2 TCe', notes: null, engine: null });
		expect(p09?.delta).toBe(-8);
		expect(p12?.delta).toBe(-8);
	});

	it('flags Suzuki 1.3 DDiS with the same penalty as the Fiat 1.3 Multijet', () => {
		const p = getEngineProfile({ title: 'Suzuki Swift 1.3 DDiS', notes: null, engine: '1.3 DDiS' });
		expect(p?.delta).toBe(-16);
		expect(p?.reason).toMatch(/DDiS/);
	});

	it('flags Mazda 1.4 MZ-CD as a rebadged PSA DV4', () => {
		const p = getEngineProfile({ title: 'Mazda 2 1.4 MZ-CD Comfort', notes: null, engine: '1.4 MZ-CD' });
		expect(p?.delta).toBe(-10);
		expect(p?.reason).toMatch(/DV4/);
	});

	it('skips diesel profiles when the car is Gasolina', () => {
		const p = getEngineProfile({
			title: 'Peugeot 308 1.6',
			notes: '1.6 HDi mentioned in stray text',
			engine: null,
			fuel: 'Gasolina'
		});
		expect(p).toBeNull();
	});

	it('still matches diesel profiles when car.fuel is null (unknown)', () => {
		const p = getEngineProfile({
			title: 'Peugeot 308 1.6 HDi',
			notes: null,
			engine: null,
			fuel: null
		});
		expect(p?.delta).toBe(-4);
	});

	it('flags Opel A14NET/B14NET turbo', () => {
		const p = getEngineProfile({
			title: 'Opel Astra J 1.4 Turbo',
			notes: 'engine code A14NET',
			engine: null
		});
		expect(p?.delta).toBe(-6);
	});
});

describe('reliabilitySubscore', () => {
	it('clamps score to [0,100]', () => {
		const r = reliabilitySubscore({ make: 'Toyota', title: '1.4 D-4D', notes: null, engine: null });
		expect(r.score).toBeLessThanOrEqual(100);
		expect(r.score).toBe(100);
		expect(r.delta).toBe(18);
	});

	it('applies engine delta to make base', () => {
		const r = reliabilitySubscore({
			make: 'Fiat',
			title: 'Fiat Punto 1.3 Multijet',
			notes: null,
			engine: null
		});
		expect(r.base).toBe(48);
		expect(r.delta).toBe(-16);
		expect(r.score).toBe(32);
	});

	it('uses base only when no engine profile matches', () => {
		const r = reliabilitySubscore({ make: 'Honda', title: 'Civic', notes: null, engine: null });
		expect(r.delta).toBe(0);
		expect(r.score).toBe(88);
	});
});
