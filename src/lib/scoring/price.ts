import type { Car } from '../types';
import { PRICE_THRESHOLDS } from '../constants';

export function priceSubscore(car: Pick<Car, 'price'>): number {
	if (!car.price) return 50;
	const { sweetSpot, budget, ceiling } = PRICE_THRESHOLDS;
	if (car.price <= sweetSpot) return 100;
	if (car.price >= ceiling) return 0;
	if (car.price <= budget) {
		return Math.round(100 - ((car.price - sweetSpot) / (budget - sweetSpot)) * 50);
	}
	return Math.round(50 - ((car.price - budget) / (ceiling - budget)) * 50);
}
