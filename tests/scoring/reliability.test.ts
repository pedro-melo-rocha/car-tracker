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
		expect(getMakeReliability('BMW')).toBe(60);
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
