import { describe, it, expect } from 'vitest';
import { parsePiscaPisca } from '../src/lib/server/importers/piscapisca';

function page(vehicle: Record<string, unknown>): string {
	return `<html><head><meta property="og:image" content="https://img/x.jpg"></head><body>
<script id="ng-state" type="application/json">${JSON.stringify({ VEHICLE_DETAIL: vehicle })}</script></body></html>`;
}

describe('parsePiscaPisca', () => {
	it('reads the vehicle record from the Angular transfer state', () => {
		const r = parsePiscaPisca(
			page({
				brand: 'Renault',
				model: 'Clio',
				serie: '1.5 dCi Dynamique',
				registerYear: 2012,
				kms: 150000,
				fuel: 'Diesel',
				powerCv: 90,
				cylinderCapacity: 1461,
				origin: 'Importado',
				standardWarranty: 'Stand - 18 meses - Por Mútuo Acordo',
				transmission: 'Manual',
				pricePrivate: 4500,
				sellerType: 'Particular',
				sellerInfo: { address: { county: 'Vila do Conde', district: 'Porto' } },
				images: [{}, {}, {}],
				notes: '<p>Carro <strong>impecável</strong></p><br>'
			}),
			'https://www.piscapisca.pt/carros/usados/renault-clio/abc'
		);
		expect(r).toMatchObject({
			make: 'Renault',
			model: 'Clio',
			year: 2012,
			km: 150000,
			price: 4500,
			power: 90,
			fuel: 'Diesel',
			engine: '1.5 dCi',
			location: 'Vila do Conde, Porto',
			sellerType: 'private',
			gearbox: 'Manual',
			imported: true,
			warrantyMonths: 18,
			photoCount: 3,
			description: 'Carro impecável',
			title: 'Renault Clio 1.5 dCi 2012',
			imageUrl: 'https://img/x.jpg'
		});
	});
});
