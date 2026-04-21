import type { Car } from '../types';

export type ScamFlag = {
	id: 'low-km-per-year' | 'recent-cheap' | 'unicorn-combo' | 'big-engine-cheap' | 'below-market-estimate';
	label: string;
};

export type ScamLevel = 'none' | 'low' | 'high';

export interface ScamRisk {
	level: ScamLevel;
	flags: ScamFlag[];
}

type SuspectCar = Pick<Car, 'year' | 'km' | 'price' | 'engine'>;

function parseDisplacement(engine: string | null | undefined): number | null {
	if (!engine) return null;
	const m = engine.match(/(\d+\.\d)/);
	if (!m) return null;
	const n = parseFloat(m[1]);
	return Number.isFinite(n) && n > 0 && n < 10 ? n : null;
}

function estimateMarketFloor(
	year: number | null | undefined,
	km: number | null | undefined,
	displacementL: number | null
): number | null {
	if (year == null || km == null) return null;
	const age = Math.max(0, 2026 - year);
	let floor = 2000 + Math.max(0, 22 - age) * 550;
	if (displacementL != null) {
		if (displacementL >= 2.0) floor *= 1.35;
		else if (displacementL >= 1.6) floor *= 1.15;
	}
	floor -= Math.max(0, (km - 100_000) / 1000) * 25;
	return Math.max(1500, floor);
}

export function detectScamRisk(car: SuspectCar, now: number = new Date().getFullYear()): ScamRisk {
	const flags: ScamFlag[] = [];
	const displacementL = parseDisplacement(car.engine);

	if (car.year != null && car.km != null) {
		const age = Math.max(1, now - car.year);
		if (car.km / age <= 5500) {
			flags.push({
				id: 'low-km-per-year',
				label: 'Very low km per year — possible odometer rollback'
			});
		}
	}

	if (car.year != null && car.price != null && car.year >= 2018 && car.price < 3000) {
		flags.push({
			id: 'recent-cheap',
			label: 'Recent year with unusually low price'
		});
	}

	if (
		car.km != null &&
		car.price != null &&
		car.year != null &&
		car.km < 80_000 &&
		car.price < 3000 &&
		car.year >= 2015
	) {
		flags.push({
			id: 'unicorn-combo',
			label: 'Low km, low price and recent year combined'
		});
	}

	if (
		car.year != null &&
		car.price != null &&
		displacementL != null &&
		displacementL >= 1.9 &&
		car.price < 3500 &&
		now - car.year >= 8
	) {
		flags.push({
			id: 'big-engine-cheap',
			label: 'Large engine (≥1.9L) priced too low for its class'
		});
	}

	if (car.price != null) {
		const floor = estimateMarketFloor(car.year, car.km, displacementL);
		if (floor != null && car.price < 0.65 * floor) {
			flags.push({
				id: 'below-market-estimate',
				label: 'Price well below typical market floor for this spec'
			});
		}
	}

	const weight = flags.length;
	const level: ScamLevel = weight >= 3 ? 'high' : weight >= 1 ? 'low' : 'none';

	return { level, flags };
}
