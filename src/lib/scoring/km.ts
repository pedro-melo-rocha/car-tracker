import type { Car } from '../types';

export function kmSubscore(car: Pick<Car, 'km' | 'fuel'>): number {
	if (!car.km) return 50;
	const petrol = car.fuel === 'Gasolina';
	const sweetUpper = petrol ? 90000 : 130000;
	const endOfLife = petrol ? 200000 : 280000;
	if (car.km <= sweetUpper) return 100;
	if (car.km >= endOfLife) return 0;
	return Math.round(100 - ((car.km - sweetUpper) / (endOfLife - sweetUpper)) * 100);
}
