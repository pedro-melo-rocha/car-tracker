import type { Car } from '$lib/types';

// IUC 2026 approximations based on maisvalias.com tables.
// Values drift yearly with inflation — tune here when the official DGCI table updates.

export type IUCCategory = 'A' | 'B';

export interface IUCEstimate {
	euros: number;
	category: IUCCategory;
	cc: number;
	estimated: boolean; // true when Category B CO2 was inferred rather than known
}

// Category A (registered before July 2007): cc-based brackets × age coefficient.
const IUC_A_BASE: Array<{ maxCc: number; value: number }> = [
	{ maxCc: 1000, value: 18.14 },
	{ maxCc: 1300, value: 36.42 },
	{ maxCc: 1750, value: 56.57 },
	{ maxCc: 2600, value: 143.74 },
	{ maxCc: 3500, value: 260.87 },
	{ maxCc: Infinity, value: 466.07 }
];

function ageCoefficientA(year: number): number {
	if (year <= 1979) return 1.0;
	if (year <= 1989) return 1.15;
	if (year <= 1995) return 1.3;
	return 1.4;
}

// Category B (registered July 2007 onwards): cc component + CO2 component (+ diesel surcharge).
const IUC_B_CC: Array<{ maxCc: number; value: number }> = [
	{ maxCc: 1250, value: 31.42 },
	{ maxCc: 1750, value: 63.04 },
	{ maxCc: 2500, value: 126.09 },
	{ maxCc: Infinity, value: 431.52 }
];

const IUC_B_CO2_PETROL: Array<{ maxCo2: number; value: number }> = [
	{ maxCo2: 120, value: 62.95 },
	{ maxCo2: 140, value: 94.47 },
	{ maxCo2: 160, value: 188.95 },
	{ maxCo2: 180, value: 438.15 },
	{ maxCo2: 210, value: 725.26 },
	{ maxCo2: Infinity, value: 1241.36 }
];

// Diesel pays higher CO2 component + a yearly surcharge.
const IUC_B_CO2_DIESEL_MULTIPLIER = 1.1;
const IUC_B_DIESEL_SURCHARGE = 19.4;

function pickBracket<T extends { value: number }>(
	brackets: Array<T & { maxCc?: number; maxCo2?: number }>,
	value: number,
	key: 'maxCc' | 'maxCo2'
): number {
	for (const b of brackets) {
		if (value <= (b[key] as number)) return b.value;
	}
	return brackets[brackets.length - 1].value;
}

/**
 * Parse displacement in cc from an engine string like "1.9 TDI" → 1900, "1600 16V" → 1600.
 * Returns null when nothing plausible is found.
 */
export function parseCc(engine: string | null | undefined): number | null {
	if (!engine) return null;
	const s = engine.trim();
	const decimal = s.match(/(\d)\.(\d)/);
	if (decimal) {
		const cc = parseInt(decimal[1]) * 1000 + parseInt(decimal[2]) * 100;
		if (cc >= 600 && cc <= 8000) return cc;
	}
	const integer = s.match(/(\d{3,4})/);
	if (integer) {
		const cc = parseInt(integer[1]);
		if (cc >= 600 && cc <= 8000) return cc;
	}
	return null;
}

/**
 * Heuristic CO2 (g/km) when the listing doesn't provide it.
 * Rough linear model from cc + fuel, softly corrected for year (newer engines are cleaner).
 */
function estimateCo2(cc: number, fuel: string | null | undefined, year: number): number {
	const isDiesel = fuel?.toLowerCase().startsWith('d') ?? false;
	const base = isDiesel ? 90 + 0.035 * cc : 110 + 0.045 * cc;
	const yearAdj = year >= 2010 ? -(year - 2010) * 1.2 : 0;
	return Math.max(70, Math.round(base + yearAdj));
}

export function computeIUC(
	car: Pick<Car, 'engine' | 'fuel' | 'year'>
): IUCEstimate | null {
	const cc = parseCc(car.engine);
	if (!cc || !car.year) return null;

	const category: IUCCategory = car.year < 2007 ? 'A' : 'B';

	if (category === 'A') {
		const base = pickBracket(IUC_A_BASE, cc, 'maxCc');
		const euros = Math.round(base * ageCoefficientA(car.year));
		return { euros, category, cc, estimated: false };
	}

	const ccComponent = pickBracket(IUC_B_CC, cc, 'maxCc');
	const co2 = estimateCo2(cc, car.fuel, car.year);
	const isDiesel = car.fuel?.toLowerCase().startsWith('d') ?? false;
	let co2Component = pickBracket(IUC_B_CO2_PETROL, co2, 'maxCo2');
	if (isDiesel) co2Component = co2Component * IUC_B_CO2_DIESEL_MULTIPLIER + IUC_B_DIESEL_SURCHARGE;

	return {
		euros: Math.round(ccComponent + co2Component),
		category,
		cc,
		estimated: true
	};
}

export function iucTone(euros: number): 'good' | 'warn' | 'bad' {
	if (euros < 100) return 'good';
	if (euros <= 200) return 'warn';
	return 'bad';
}
