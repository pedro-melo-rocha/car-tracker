import type { Car } from '../types';
import { reliabilitySubscore } from './reliability';

export type ScamFlag = {
	id:
		| 'low-km-per-year'
		| 'recent-cheap'
		| 'unicorn-combo'
		| 'big-engine-cheap'
		| 'below-market-estimate'
		| 'below-peer-median'
		| 'new-account'
		| 'new-account-cheap'
		| 'imported-low-km'
		| 'scam-wording'
		| 'pressure-wording'
		| 'few-photos'
		| 'missing-key-data';
	label: string;
	/** 1 = weak hint, 2 = meaningful, 3 = strong on its own. */
	weight: 1 | 2 | 3;
};

/** Total weight at or above this is "Likely scam"; anything above 0 is "Suspicious". */
export const HIGH_RISK_WEIGHT = 4;

export type ScamLevel = 'none' | 'low' | 'high';

export interface ScamRisk {
	level: ScamLevel;
	flags: ScamFlag[];
}

export interface DetectScamOptions {
	peers?: Car[];
	now?: number;
}

type SuspectCar = Pick<Car, 'id' | 'make' | 'model' | 'title' | 'notes' | 'year' | 'km' | 'price' | 'engine'> &
	Partial<Pick<Car, 'sellerType' | 'sellerSince' | 'imported' | 'photoCount' | 'description'>>;

/**
 * Classic Portuguese marketplace scam script: seller abroad, car shipped by a carrier,
 * money up front. Any one of these in a cheap listing is a strong signal.
 */
const SCAM_WORDING: Array<[RegExp, string]> = [
	[/emigrad[oa]|estou (a viver |a trabalhar )?(fora|no estrangeiro)|encontro-me (fora|no estrangeiro)|trabalho (fora|no estrangeiro)/i, 'seller abroad'],
	[/transportadora|envio (o carro|a viatura|o ve[ií]culo)|entrega (ao|em) domic[ií]lio/i, 'shipping by carrier'],
	[/pagamento antecipado|adiantamento|transfer[eê]ncia (banc[aá]ria )?antes/i, 'payment up front'],
	[/sem (possibilidade de )?visitas|n[aã]o (aceito|permito) visitas/i, 'no viewings']
];
/** Softer pressure language — common in legit ads too, so weak on its own. */
const PRESSURE_WORDING: Array<[RegExp, string]> = [
	[/\burgente\b|vendo r[aá]pido|sem tempo/i, 'urgency'],
	[/s[oó] (por |via )?whats ?app|apenas (por |via )?whats ?app|contacto (s[oó] )?(por|via) whats ?app/i, 'WhatsApp only'],
	[/\bsinal\b/i, 'deposit requested']
];

function matchWording(text: string, rules: Array<[RegExp, string]>): string[] {
	return rules.filter(([re]) => re.test(text)).map(([, label]) => label);
}

function parseDisplacement(engine: string | null | undefined): number | null {
	if (!engine) return null;
	const m = engine.match(/(\d+\.\d)/);
	if (!m) return null;
	const n = parseFloat(m[1]);
	return Number.isFinite(n) && n > 0 && n < 10 ? n : null;
}

function estimateMarketFloor(
	nowYear: number,
	year: number | null | undefined,
	km: number | null | undefined,
	displacementL: number | null,
	reliabilityScore: number
): number | null {
	if (year == null || km == null) return null;
	const age = Math.max(0, nowYear - year);
	let floor = 2000 + Math.max(0, 22 - age) * 550;
	if (displacementL != null) {
		if (displacementL >= 2.0) floor *= 1.35;
		else if (displacementL >= 1.6) floor *= 1.15;
	}
	floor -= Math.max(0, (km - 100_000) / 1000) * 25;
	const reliabilityMultiplier =
		reliabilityScore >= 75 ? 1 + ((reliabilityScore - 75) / 25) * 0.7 : 1;
	floor *= reliabilityMultiplier;
	return Math.max(1500, floor);
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function findPeers(car: SuspectCar, peers: Car[]): Car[] {
	if (!car.make || !car.model || car.year == null || car.km == null) return [];
	const makeKey = car.make.toLowerCase().trim();
	const modelKey = car.model.toLowerCase().trim();
	const kmTolerance = Math.max(40_000, car.km * 0.3);
	return peers.filter((p) => {
		if (p.id === car.id) return false;
		if (p.price == null || p.year == null || p.km == null) return false;
		if (!p.make || !p.model) return false;
		if (p.make.toLowerCase().trim() !== makeKey) return false;
		if (p.model.toLowerCase().trim() !== modelKey) return false;
		if (Math.abs(p.year - car.year!) > 2) return false;
		if (Math.abs(p.km - car.km!) > kmTolerance) return false;
		return true;
	});
}

export function detectScamRisk(
	car: SuspectCar,
	optsOrNow: DetectScamOptions | number = {}
): ScamRisk {
	const opts: DetectScamOptions = typeof optsOrNow === 'number' ? { now: optsOrNow } : optsOrNow;
	const now = opts.now ?? new Date().getFullYear();
	const flags: ScamFlag[] = [];
	const displacementL = parseDisplacement(car.engine);
	const reliability = reliabilitySubscore(car).score;

	if (car.year != null && car.km != null) {
		const age = Math.max(1, now - car.year);
		if (car.km / age <= 5500) {
			flags.push({
				id: 'low-km-per-year',
				label: 'Very low km per year (possible odometer rollback)',
				weight: 2
			});
		}
	}

	if (car.year != null && car.price != null && car.year >= 2018 && car.price < 3000) {
		flags.push({
			id: 'recent-cheap',
			label: 'Recent year with unusually low price',
			weight: 2
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
			label: 'Low km, low price and recent year combined',
			weight: 2
		});
	}

	if (
		car.year != null &&
		car.price != null &&
		displacementL != null &&
		displacementL >= 1.9 &&
		car.price < 3500 &&
		now - car.year >= 8
	) {
		flags.push({
			id: 'big-engine-cheap',
			label: 'Large engine (≥1.9L) priced too low for its class',
			weight: 1
		});
	}

	if (car.price != null) {
		const floor = estimateMarketFloor(now, car.year, car.km, displacementL, reliability);
		if (floor != null && car.price < 0.65 * floor) {
			flags.push({
				id: 'below-market-estimate',
				label: 'Price well below typical market floor for this spec',
				weight: 2
			});
		}
	}

	if (car.price != null && opts.peers && opts.peers.length > 0) {
		const matched = findPeers(car, opts.peers);
		if (matched.length >= 3) {
			const peerMedian = median(matched.map((p) => p.price as number));
			if (car.price < 0.7 * peerMedian) {
				flags.push({
					id: 'below-peer-median',
					label: 'Priced well below similar cars in your list',
					weight: 2
				});
			}
		}
	}

	const priceFlagged = flags.some((f) =>
		['recent-cheap', 'unicorn-combo', 'big-engine-cheap', 'below-market-estimate', 'below-peer-median'].includes(f.id)
	);

	// Seller account created this year or last (StandVirtual only shows the year).
	if (car.sellerSince != null && car.sellerSince >= now - 1) {
		if (priceFlagged) {
			flags.push({
				id: 'new-account-cheap',
				label: `Seller account from ${car.sellerSince} with a suspiciously low price`,
				weight: 3
			});
		} else {
			flags.push({
				id: 'new-account',
				label: `Seller account only from ${car.sellerSince}`,
				weight: car.sellerType === 'private' ? 2 : 1
			});
		}
	}

	if (car.imported && car.year != null && car.km != null) {
		const age = Math.max(1, now - car.year);
		if (car.km / age <= 10_000) {
			flags.push({
				id: 'imported-low-km',
				label: 'Imported with low km, the most common source of rollbacks',
				weight: 2
			});
		}
	}

	const text = [car.title, car.description].filter(Boolean).join(' ');
	if (text) {
		const scam = matchWording(text, SCAM_WORDING);
		if (scam.length) {
			flags.push({ id: 'scam-wording', label: `Scam-script wording: ${scam.join(', ')}`, weight: 3 });
		}
		const pressure = matchWording(text, PRESSURE_WORDING);
		if (pressure.length) {
			flags.push({ id: 'pressure-wording', label: `Pressure wording: ${pressure.join(', ')}`, weight: 1 });
		}
	}

	if (car.photoCount != null && car.photoCount <= 4) {
		flags.push({ id: 'few-photos', label: `Only ${car.photoCount} photo${car.photoCount === 1 ? '' : 's'}`, weight: 1 });
	}

	// The API stores missing km/year as 0, so treat falsy as missing.
	if (car.price && car.price < 4000 && (!car.km || !car.year)) {
		flags.push({ id: 'missing-key-data', label: 'Cheap listing missing km or year', weight: 1 });
	}

	flags.sort((a, b) => b.weight - a.weight);
	const total = flags.reduce((sum, f) => sum + f.weight, 0);
	const level: ScamLevel = total >= HIGH_RISK_WEIGHT ? 'high' : total >= 1 ? 'low' : 'none';

	return { level, flags };
}
