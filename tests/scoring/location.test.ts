import { describe, it, expect } from 'vitest';
import { locationScore, locationKm, normalizeLoc } from '../../src/lib/scoring/location';

describe('normalizeLoc', () => {
	it('lowercases, trims, and strips diacritics', () => {
		expect(normalizeLoc('  Viana do Castelo  ')).toBe('viana do castelo');
		expect(normalizeLoc('Guimarães')).toBe('guimaraes');
		expect(normalizeLoc('Évora')).toBe('evora');
	});

	it('returns empty string for null/undefined', () => {
		expect(normalizeLoc(null)).toBe('');
		expect(normalizeLoc(undefined)).toBe('');
	});
});

describe('locationScore', () => {
	it('returns neutral 50 for missing/unknown location', () => {
		expect(locationScore(null)).toBe(50);
		expect(locationScore('')).toBe(50);
		expect(locationScore('Timbuktu')).toBe(50);
	});

	it('returns 100 for Viana do Castelo (zero distance)', () => {
		expect(locationScore('Viana do Castelo')).toBe(100);
	});

	it('floors distant locations at 40', () => {
		expect(locationScore('Faro')).toBeGreaterThanOrEqual(40);
		expect(locationScore('Faro')).toBeLessThan(55);
	});

	it('scores within 50km as 100', () => {
		expect(locationScore('Braga')).toBe(100);
	});

	it('handles diacritics', () => {
		expect(locationScore('Évora')).toBe(locationScore('Evora'));
	});
});

describe('locationKm', () => {
	it('returns 0 for Viana', () => {
		expect(locationKm('Viana do Castelo')).toBe(0);
	});

	it('returns null for unknown', () => {
		expect(locationKm('Nowhere')).toBeNull();
		expect(locationKm(null)).toBeNull();
	});

	it('returns distance for Porto', () => {
		expect(locationKm('Porto')).toBe(75);
	});
});
