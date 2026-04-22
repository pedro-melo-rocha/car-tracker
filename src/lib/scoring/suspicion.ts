import type { Car } from '../types';
import { reliabilitySubscore } from './reliability';

export type ScamFlag = {
	id:
		| 'low-km-per-year'
		| 'recent-cheap'
		| 'unicorn-combo'
		| 'big-engine-cheap'
		| 'below-market-estimate'
		| 'below-peer-median';
	label: string;
};

export type ScamLevel = 'none' | 'low' | 'high';

export interface ScamRisk {
	level: ScamLevel;
	flags: ScamFlag[];
}

export interface DetectScamOptions {
	peers?: Car[];
	now?: number;
}

type SuspectCar = Pick<Car, 'id' | 'make' | 'model' | 'title' | 'notes' | 'year' | 'km' | 'price' | 'engine'>;

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
	displacementL: number | null,
	reliabilityScore: number
): number | null {
	if (year == null || km == null) return null;
	const age = Math.max(0, 2026 - year);
	let floor = 2000 + Math.max(0, 22 - age) * 550;
	if (displacementL != null) {
		if (displacementL >= 2.0) floor *= 1.35;
		else if (displacementL >= 1.6) floor *= 1.15;
	}
	floor -= Math.max(0, (km - 100_000) / 1000) * 25;
	const reliabilityMultiplier =
		reliabilityScore >= 75 ? 1 + ((reliabilityScore - 75) / 25) * 0.7 : 1;
	floor *= reliabilityMultiplier;
	return Math.max(1500, floor);
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function findPeers(car: SuspectCar, peers: Car[]): Car[] {
	if (!car.make || !car.model || car.year == null || car.km == null) return [];
	const makeKey = car.make.toLowerCase().trim();
	const modelKey = car.model.toLowerCase().trim();
	const kmTolerance = Math.max(40_000, car.km * 0.3);
	return peers.filter((p) => {
		if (p.id === car.id) return false;
		if (p.price == null || p.year == null || p.km == null) return false;
		if (!p.make || !p.model) return false;
		if (p.make.toLowerCase().trim() !== makeKey) return false;
		if (p.model.toLowerCase().trim() !== modelKey) return false;
		if (Math.abs(p.year - car.year!) > 2) return false;
		if (Math.abs(p.km - car.km!) > kmTolerance) return false;
		return true;
	});
}

export function detectScamRisk(
	car: SuspectCar,
	optsOrNow: DetectScamOptions | number = {}
): ScamRisk {
	const opts: DetectScamOptions = typeof optsOrNow === 'number' ? { now: optsOrNow } : optsOrNow;
	const now = opts.now ?? new Date().getFullYear();
	const flags: ScamFlag[] = [];
	const displacementL = parseDisplacement(car.engine);
	const reliability = reliabilitySubscore(car).score;

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
		const floor = estimateMarketFloor(car.year, car.km, displacementL, reliability);
		if (floor != null && car.price < 0.65 * floor) {
			flags.push({
				id: 'below-market-estimate',
				label: 'Price well below typical market floor for this spec'
			});
		}
	}

	if (car.price != null && opts.peers && opts.peers.length > 0) {
		const matched = findPeers(car, opts.peers);
		if (matched.length >= 3) {
			const peerMedian = median(matched.map((p) => p.price as number));
			if (car.price < 0.7 * peerMedian) {
				flags.push({
					id: 'below-peer-median',
					label: 'Priced well below similar cars in your list'
				});
			}
		}
	}

	const weight = flags.length;
	const level: ScamLevel = weight >= 3 ? 'high' : weight >= 1 ? 'low' : 'none';

	return { level, flags };
}
