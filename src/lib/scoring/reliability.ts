import type { Car } from '../types';
import { MAKE_RELIABILITY, ENGINE_PROFILES, type EngineProfile } from '../constants';

const ENGINE_DELTA_CAP = 12;

export function getMakeReliability(make: string | null | undefined): number {
	if (!make) return 60;
	const key = make.toLowerCase().trim();
	if (MAKE_RELIABILITY[key] !== undefined) return MAKE_RELIABILITY[key];
	for (const k in MAKE_RELIABILITY) {
		if (key.includes(k) || k.includes(key)) return MAKE_RELIABILITY[k];
	}
	return 60;
}

export function getEngineProfile(car: Pick<Car, 'title' | 'notes' | 'engine' | 'year' | 'fuel'>): EngineProfile | null {
	const blob = [car.title, car.notes, car.engine].filter(Boolean).join(' ');
	if (!blob) return null;
	for (const p of ENGINE_PROFILES) {
		if (!p.re.test(blob)) continue;
		if (car.year != null) {
			if (p.yearMin != null && car.year < p.yearMin) continue;
			if (p.yearMax != null && car.year > p.yearMax) continue;
		}
		if (p.fuel != null && car.fuel && p.fuel !== car.fuel) continue;
		return p;
	}
	return null;
}

export interface ReliabilityBreakdown {
	score: number;
	base: number;
	delta: number;
	reason: string | null;
	/** True when an engine profile matched — false means the score is just the make baseline. */
	matched: boolean;
}

export function reliabilitySubscore(
	car: Pick<Car, 'make' | 'title' | 'notes' | 'engine' | 'year' | 'fuel'>
): ReliabilityBreakdown {
	const base = getMakeReliability(car.make);
	const profile = getEngineProfile(car);
	const rawDelta = profile ? profile.delta : 0;
	const delta = Math.max(-ENGINE_DELTA_CAP, Math.min(ENGINE_DELTA_CAP, rawDelta));
	return {
		score: Math.max(0, Math.min(100, base + delta)),
		base,
		delta,
		reason: profile ? profile.reason : null,
		matched: profile !== null
	};
}
