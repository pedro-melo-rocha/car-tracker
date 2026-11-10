import { describe, it, expect } from 'vitest';
import { guessEngine } from '../src/lib/server/importers/standvirtual';

describe('guessEngine', () => {
	it('uses an explicit displacement + family from the text', () => {
		expect(guessEngine('Renault Clio 1.5 dCi Dynamique', 1461)).toBe('1.5 dCi');
		expect(guessEngine('Peugeot 208 1,2 puretech', 1199)).toBe('1.2 PureTech');
	});

	it('combines a bare family with the listed displacement', () => {
		expect(guessEngine('Captur TCe 140 Intens', 1333)).toBe('1.3 TCe');
	});

	it('falls back to displacement only', () => {
		expect(guessEngine('VW Golf', 1968)).toBe('2.0');
		expect(guessEngine('VW Golf', undefined)).toBeUndefined();
	});
});
