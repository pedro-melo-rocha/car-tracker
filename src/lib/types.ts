export const STATUSES = [
	'to-contact',
	'contacted',
	'negotiating',
	'dismissed',
	'final-offer'
] as const;

export type CarStatus = (typeof STATUSES)[number];

export type Fuel = 'Diesel' | 'Gasolina';

export const SELLER_TYPES = ['private', 'dealer'] as const;
export type SellerType = (typeof SELLER_TYPES)[number];

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
	imageUrl?: string | null;
	contactedAt?: string | null;
	priceHistory: PriceHistoryEntry[];
	version: number;
	sellerType?: SellerType | null;
	sellerSince?: number | null;
	listedAt?: string | null;
	gearbox?: string | null;
	owners?: number | null;
	warrantyMonths?: number | null;
	imported?: boolean | null;
	photoCount?: number | null;
	description?: string | null;
}

export type PublicCar = Omit<Car, 'notes' | 'contactedAt' | 'status' | 'version'>;

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
	imageUrl?: string;
	sellerType?: SellerType | '';
	sellerSince?: number;
	listedAt?: string;
	gearbox?: string;
	owners?: number;
	warrantyMonths?: number;
	imported?: boolean;
	photoCount?: number;
	description?: string;
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
