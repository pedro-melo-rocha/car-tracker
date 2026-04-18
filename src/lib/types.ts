export const STATUSES = [
	'to-contact',
	'contacted',
	'negotiating',
	'dismissed',
	'final-offer'
] as const;

export type CarStatus = (typeof STATUSES)[number];

export type Fuel = 'Diesel' | 'Gasolina';

export interface PriceHistoryEntry {
	date: string;
	price: number;
	note?: string;
}

export interface Car {
	id: string;
	addedAt: string;
	url?: string | null;
	title: string;
	make?: string | null;
	model?: string | null;
	year?: number | null;
	km?: number | null;
	price?: number | null;
	fuel?: string | null;
	engine?: string | null;
	power?: number | null;
	source?: string | null;
	status: CarStatus;
	location?: string | null;
	notes?: string | null;
	contactedAt?: string | null;
	priceHistory: PriceHistoryEntry[];
	version: number;
}

export interface CarCreateInput {
	url?: string;
	title: string;
	make?: string;
	model?: string;
	year?: number;
	km?: number;
	price?: number;
	fuel?: string;
	engine?: string;
	power?: number;
	source?: string;
	status?: CarStatus;
	location?: string;
	notes?: string;
}

export interface CarUpdateInput extends Partial<CarCreateInput> {
	priceNote?: string;
	version?: number;
}

export const STATUS_LABELS: Record<CarStatus, string> = {
	'to-contact': 'To Contact',
	contacted: 'Contacted',
	negotiating: 'Negotiating',
	dismissed: 'Dismissed',
	'final-offer': 'Final Offer'
};
