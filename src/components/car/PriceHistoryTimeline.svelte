<script lang="ts">
	import type { PriceHistoryEntry } from '$lib/types';

	let { history }: { history: PriceHistoryEntry[] } = $props();

	const sorted = $derived(
		[...(history ?? [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
	);

	function fmtDate(iso: string) {
		return new Date(iso).toLocaleDateString();
	}
</script>

<div class="timeline">
	{#each sorted as p (p.date + p.price)}
		<div class="item">
			<span class="price">€{p.price.toLocaleString()}</span>
			<span class="date">{fmtDate(p.date)}</span>
			{#if p.note}
				<span class="note">{p.note}</span>
			{/if}
		</div>
	{/each}
	{#if !sorted.length}
		<div class="empty">No price history.</div>
	{/if}
</div>

<style>
	.timeline {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.item {
		display: grid;
		grid-template-columns: auto auto 1fr;
		gap: 10px;
		align-items: baseline;
		padding: 6px 10px;
		background: var(--bg);
		border-radius: var(--radius-sm);
	}
	.price {
		font-family: var(--mono);
		font-weight: 700;
		color: var(--green);
	}
	.date {
		font-size: 0.78rem;
		color: var(--text-muted);
		font-family: var(--mono);
	}
	.note {
		font-size: 0.78rem;
		color: var(--text-secondary);
	}
	.empty {
		color: var(--text-muted);
		font-size: 0.82rem;
	}
</style>
