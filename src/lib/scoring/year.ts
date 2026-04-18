import type { Car } from '../types';

export function yearSubscore(car: Pick<Car, 'year'>): number {
	if (!car.year) return 50;
	return Math.max(0, Math.min(100, Math.round(((car.year - 2005) / 15) * 100)));
}
