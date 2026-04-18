import { LOCATION_DISTANCES } from '../constants';

export function normalizeLoc(s: string | null | undefined): string {
	return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

export function locationScore(location: string | null | undefined): number {
	if (!location) return 50;
	const loc = normalizeLoc(location);
	for (const [place, dist] of Object.entries(LOCATION_DISTANCES)) {
		if (loc.includes(normalizeLoc(place))) {
			return Math.max(0, Math.round(100 - (dist / 600) * 30));
		}
	}
	return 50;
}

export function locationKm(location: string | null | undefined): number | null {
	if (!location) return null;
	const loc = normalizeLoc(location);
	for (const [place, dist] of Object.entries(LOCATION_DISTANCES)) {
		if (loc.includes(normalizeLoc(place))) return dist;
	}
	return null;
}
