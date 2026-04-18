import type { PriceHistoryEntry } from './types';

export function netPriceDrop(history: PriceHistoryEntry[] | undefined | null): number {
	const h = history ?? [];
	if (h.length < 2) return 0;
	const sorted = [...h].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
	const first = sorted[0].price;
	const last = sorted[sorted.length - 1].price;
	return first > last ? first - last : 0;
}
