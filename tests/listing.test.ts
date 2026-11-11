import { describe, it, expect } from 'vitest';
import { normalizeListingUrl, buildTitle, isAutoTitle } from '../src/lib/listing';

describe('normalizeListingUrl', () => {
	it('strips tracking params from known listing hosts', () => {
		expect(
			normalizeListingUrl('https://www.olx.pt/d/anuncio/toyota-yaris-1-0-IDJdtlV.html?au_advert_id=1&utm_medium=x')
		).toBe('https://www.olx.pt/d/anuncio/toyota-yaris-1-0-IDJdtlV.html');
		expect(
			normalizeListingUrl('https://www.facebook.com/marketplace/item/813710431210182/?referralSurface=messenger')
		).toBe('https://www.facebook.com/marketplace/item/813710431210182/');
	});

	it('leaves unknown hosts and invalid URLs alone', () => {
		expect(normalizeListingUrl('https://example.com/car?id=5')).toBe('https://example.com/car?id=5');
		expect(normalizeListingUrl('not a url')).toBe('not a url');
		expect(normalizeListingUrl('')).toBe('');
	});
});

describe('buildTitle', () => {
	it('detects StandVirtual price/km titles', () => {
		expect(isAutoTitle('VW Golf 2004 - 4 000 EUR, 99 999 km')).toBe(true);
		expect(isAutoTitle('Renault Clio 1.5 dCi')).toBe(false);
	});

	it('builds make model engine year', () => {
		expect(buildTitle({ make: 'Mazda', model: '3 Hatchback', engine: '1.6 MZ-CD', year: 2006 })).toBe(
			'Mazda 3 Hatchback 1.6 MZ-CD 2006'
		);
	});

	it('does not repeat the make when the engine label includes it', () => {
		expect(buildTitle({ make: 'Honda', model: 'Civic', engine: 'Honda i-VTEC', year: 2004 })).toBe(
			'Honda Civic i-VTEC 2004'
		);
	});

	it('does not repeat the make when the model starts with it', () => {
		expect(buildTitle({ make: 'DS', model: 'DS 4', engine: '1.2', year: 2025 })).toBe('DS 4 1.2 2025');
	});

	it('falls back to the title without price/km when make/model are missing', () => {
		expect(buildTitle({}, 'Opel 1204 2010 - 3 800 EUR, 124 000 km')).toBe('Opel 1204 2010');
	});
});
