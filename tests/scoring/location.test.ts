import { describe, it, expect } from 'vitest';
import { locationScore, locationKm, normalizeLoc, formatLocation } from '../../src/lib/scoring/location';

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

describe('locationKm — municipalities', () => {
	it('knows municipalities beyond the hand-tuned list', () => {
		expect(locationKm('vila do conde')).toBe(55);
		expect(locationKm('Póvoa de Varzim')).toBe(40);
	});

	it('prefers the most specific comma part', () => {
		expect(locationKm('Vila do Conde, Porto')).toBe(55);
		expect(locationKm('Ramalde, Porto')).toBe(75);
	});

	it('prefers the longest name match', () => {
		expect(locationKm('Viana do Alentejo')).toBeGreaterThan(400);
		expect(locationKm('Porto de Mós')).toBeGreaterThan(250);
	});
});

describe('formatLocation', () => {
	it('canonicalises casing and accents of known places', () => {
		expect(formatLocation('vila do conde')).toBe('Vila do Conde');
		expect(formatLocation('VILA DO CONDE, porto')).toBe('Vila do Conde, Porto');
		expect(formatLocation('povoa de varzim')).toBe('Póvoa de Varzim');
		expect(formatLocation('montemor-o-novo')).toBe('Montemor-o-Novo');
	});

	it('title-cases unknown places keeping particles lowercase', () => {
		expect(formatLocation('sande vila nova e sande são clemente')).toBe('Sande Vila Nova e Sande São Clemente');
	});

	it('returns empty string for empty input', () => {
		expect(formatLocation('')).toBe('');
		expect(formatLocation(null)).toBe('');
	});
});
