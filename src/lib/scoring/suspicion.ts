import type { Car } from '../types';
import { NON_PAID_SOURCES } from '../constants';

export type ScamFlag = {
	id: 'low-km-per-year' | 'recent-cheap' | 'unicorn-combo' | 'non-paid-source';
	label: string;
};

export type ScamLevel = 'none' | 'low' | 'high';

export interface ScamRisk {
	level: ScamLevel;
	flags: ScamFlag[];
	nonPaidSource: boolean;
}

type SuspectCar = Pick<Car, 'year' | 'km' | 'price' | 'source'>;

export function detectScamRisk(car: SuspectCar, now: number = new Date().getFullYear()): ScamRisk {
	const flags: ScamFlag[] = [];

	if (car.year != null && car.km != null) {
		const age = Math.max(1, now - car.year);
		if (car.km / age < 5000) {
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

	const nonPaidSource = car.source != null && NON_PAID_SOURCES.has(car.source);

	if (flags.length > 0 && nonPaidSource) {
		flags.push({
			id: 'non-paid-source',
			label: 'Listed on a free platform with less moderation'
		});
	}

	const weight = flags.length;
	const level: ScamLevel = weight >= 3 ? 'high' : weight >= 1 ? 'low' : 'none';

	return { level, flags, nonPaidSource };
}
