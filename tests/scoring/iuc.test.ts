import { describe, it, expect } from 'vitest';
import { computeIUC, parseCc, iucTone } from '../../src/lib/scoring/iuc';

describe('parseCc', () => {
	it('parses decimal notation', () => {
		expect(parseCc('1.9 TDI')).toBe(1900);
		expect(parseCc('1.4 TSI')).toBe(1400);
		expect(parseCc('2.0 HDi')).toBe(2000);
	});

	it('parses integer notation', () => {
		expect(parseCc('1600 16V')).toBe(1600);
		expect(parseCc('2000cc')).toBe(2000);
	});

	it('returns null on unparseable or missing input', () => {
		expect(parseCc(null)).toBeNull();
		expect(parseCc('')).toBeNull();
		expect(parseCc('TDI')).toBeNull();
	});

	it('rejects implausible values', () => {
		expect(parseCc('99')).toBeNull();
		expect(parseCc('99999')).toBeNull();
	});
});

describe('computeIUC', () => {
	it('returns null when engine or year is missing', () => {
		expect(computeIUC({ engine: null, fuel: 'Diesel', year: 2010 })).toBeNull();
		expect(computeIUC({ engine: '1.9 TDI', fuel: 'Diesel', year: null })).toBeNull();
	});

	it('computes Category A for pre-2007 cars', () => {
		const r = computeIUC({ engine: '1.9 TDI', fuel: 'Diesel', year: 2005 });
		expect(r).not.toBeNull();
		expect(r!.category).toBe('A');
		expect(r!.cc).toBe(1900);
		expect(r!.estimated).toBe(false);
		expect(r!.euros).toBeGreaterThan(50);
		expect(r!.euros).toBeLessThan(250);
	});

	it('Category A older cars get lower age coefficient', () => {
		const old = computeIUC({ engine: '1.6', fuel: 'Gasolina', year: 1985 });
		const recent = computeIUC({ engine: '1.6', fuel: 'Gasolina', year: 2005 });
		expect(old!.euros).toBeLessThan(recent!.euros);
	});

	it('computes Category B for post-2007 cars', () => {
		const r = computeIUC({ engine: '1.4 TSI', fuel: 'Gasolina', year: 2015 });
		expect(r!.category).toBe('B');
		expect(r!.estimated).toBe(true);
		expect(r!.euros).toBeGreaterThan(0);
	});

	it('larger engines cost more', () => {
		const small = computeIUC({ engine: '1.0', fuel: 'Gasolina', year: 2015 });
		const big = computeIUC({ engine: '3.0', fuel: 'Gasolina', year: 2015 });
		expect(big!.euros).toBeGreaterThan(small!.euros);
	});
});

describe('iucTone', () => {
	it('maps to bands', () => {
		expect(iucTone(50)).toBe('good');
		expect(iucTone(99)).toBe('good');
		expect(iucTone(100)).toBe('warn');
		expect(iucTone(200)).toBe('warn');
		expect(iucTone(201)).toBe('bad');
	});
});
