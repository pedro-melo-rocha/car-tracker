import type { Car } from '../types';

export function priceSubscore(car: Pick<Car, 'price'>): number {
	if (!car.price) return 50;
	if (car.price <= 2500) return 100;
	if (car.price >= 5000) return 0;
	return Math.round(100 - ((car.price - 2500) / 2500) * 100);
}
