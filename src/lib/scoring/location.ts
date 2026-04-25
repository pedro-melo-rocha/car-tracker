import { LOCATION_DISTANCES } from '../constants';

export function normalizeLoc(s: string | null | undefined): string {
	return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

export function locationScore(location: string | null | undefined): number {
	if (!location) return 50;
	const loc = normalizeLoc(location);
	for (const [place, dist] of Object.entries(LOCATION_DISTANCES)) {
		if (loc.includes(normalizeLoc(place))) {
			return distanceToScore(dist);
		}
	}
	return 50;
}

function distanceToScore(dist: number): number {
	if (dist <= 50) return 100;
	if (dist <= 200) return Math.round(100 - ((dist - 50) / 150) * 30);
	return Math.max(40, Math.round(70 - ((dist - 200) / 400) * 30));
}

export function locationKm(location: string | null | undefined): number | null {
	if (!location) return null;
	const loc = normalizeLoc(location);
	for (const [place, dist] of Object.entries(LOCATION_DISTANCES)) {
		if (loc.includes(normalizeLoc(place))) return dist;
	}
	return null;
}
