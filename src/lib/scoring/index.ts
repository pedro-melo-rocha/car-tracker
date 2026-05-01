import type { Car } from '../types';
import { SCORE_WEIGHTS } from '../constants';
import { kmSubscore } from './km';
import { priceSubscore } from './price';
import { yearSubscore } from './year';
import { locationScore } from './location';
import { reliabilitySubscore, type ReliabilityBreakdown } from './reliability';

export interface ScoreBreakdown {
	total: number;
	km: number;
	price: number;
	year: number;
	loc: number;
	rel: ReliabilityBreakdown;
}

type ScoreableCar = Pick<
	Car,
	'km' | 'fuel' | 'price' | 'year' | 'location' | 'make' | 'title' | 'notes' | 'engine'
>;

export function computeScoreBreakdown(car: ScoreableCar): ScoreBreakdown {
	const km = kmSubscore(car);
	const price = priceSubscore(car);
	const year = yearSubscore(car);
	const loc = locationScore(car.location);
	const rel = reliabilitySubscore(car);
	const total = Math.round(
		km * SCORE_WEIGHTS.km +
			price * SCORE_WEIGHTS.price +
			rel.score * SCORE_WEIGHTS.reliability +
			year * SCORE_WEIGHTS.year +
			loc * SCORE_WEIGHTS.location
	);
	return { total, km, price, year, loc, rel };
}

export function computeScore(car: ScoreableCar): number {
	return computeScoreBreakdown(car).total;
}

type IdentifiableCar = ScoreableCar & { id: string; version: number };

const breakdownCache = new Map<string, { version: number; breakdown: ScoreBreakdown }>();

export function cachedScoreBreakdown(car: IdentifiableCar): ScoreBreakdown {
	const hit = breakdownCache.get(car.id);
	if (hit && hit.version === car.version) return hit.breakdown;
	const breakdown = computeScoreBreakdown(car);
	breakdownCache.set(car.id, { version: car.version, breakdown });
	return breakdown;
}

export function cachedScore(car: IdentifiableCar): number {
	return cachedScoreBreakdown(car).total;
}

export function scoreClass(score: number): 'green' | 'yellow' | 'red' {
	if (score >= 70) return 'green';
	if (score >= 50) return 'yellow';
	return 'red';
}

export { kmSubscore, priceSubscore, yearSubscore, locationScore, reliabilitySubscore };
export { normalizeLoc, locationKm } from './location';
export { getMakeReliability, getEngineProfile } from './reliability';
export { detectScamRisk, type ScamFlag, type ScamLevel, type ScamRisk } from './suspicion';
