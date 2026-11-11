<script lang="ts">
	import type { PriceHistoryEntry } from '$lib/types';

	let { history }: { history: PriceHistoryEntry[] } = $props();

	const sorted = $derived(
		[...(history ?? [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
	);

	function fmtDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	// Direction against the previous entry: down is good news, up is bad.
	function trend(i: number): 'down' | 'up' | 'first' {
		if (i === 0) return 'first';
		return sorted[i].price < sorted[i - 1].price ? 'down' : 'up';
	}
</script>

{#if sorted.length}
	<ol class="timeline">
		{#each sorted as p, i (p.date + p.price)}
			{@const t = trend(i)}
			<li class="item {t}">
				<span class="price">€{p.price.toLocaleString('pt-PT')}</span>
				<span class="date">{fmtDate(p.date)}</span>
				{#if t !== 'first'}
					<span class="delta">
						{t === 'down' ? '−' : '+'}€{Math.abs(p.price - sorted[i - 1].price).toLocaleString('pt-PT')}
					</span>
				{/if}
				{#if p.note}
					<span class="note">{p.note}</span>
				{/if}
			</li>
		{/each}
	</ol>
{:else}
	<p class="empty">No price changes yet.</p>
{/if}

<style>
	.timeline {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.item {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 4px 12px;
		align-items: baseline;
		font-size: 0.9rem;
		font-variant-numeric: tabular-nums;
	}
	.price {
		font-weight: 650;
		color: var(--ink);
	}
	.date {
		font-size: 0.82rem;
		color: var(--ink-soft);
	}
	.delta {
		font-size: 0.85rem;
		font-weight: 600;
	}
	.item.down .delta {
		color: var(--good);
	}
	.item.up .delta {
		color: var(--bad);
	}
	.note {
		grid-column: 1 / -1;
		font-size: 0.82rem;
		color: var(--ink-soft);
	}
	.empty {
		color: var(--ink-soft);
		font-size: 0.85rem;
	}
</style>
