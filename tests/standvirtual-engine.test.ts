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

import { normalizeEngine } from '../src/lib/constants';

describe('normalizeEngine', () => {
	it('canonicalises engine codes and decimal commas', () => {
		expect(normalizeEngine('1,4 fsi')).toBe('1.4 FSI');
		expect(normalizeEngine('1.4 d-4-d')).toBe('1.4 D-4D');
		expect(normalizeEngine('1.5 DCI')).toBe('1.5 dCi');
		expect(normalizeEngine('1.4 cvvt')).toBe('1.4 CVVT');
		expect(normalizeEngine('  2.0  XSi-Automat ')).toBe('2.0 XSi-Automat');
		expect(normalizeEngine('')).toBe('');
	});
});
