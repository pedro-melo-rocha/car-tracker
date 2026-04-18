<script lang="ts">
	import type { Car } from '$lib/types';
	import { computeScore } from '$lib/scoring';
	import ScoreBadge from '$components/ui/ScoreBadge.svelte';
	import StatusPill from '$components/ui/StatusPill.svelte';

	let {
		car,
		onopen,
		onedit,
		ondelete
	}: {
		car: Car;
		onopen?: (id: string) => void;
		onedit?: (id: string) => void;
		ondelete?: (id: string) => void;
	} = $props();

	const score = $derived(computeScore(car));
</script>

<div
	class="list-card"
	role="button"
	tabindex="0"
	onclick={() => onopen?.(car.id)}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onopen?.(car.id);
		}
	}}
>
	<div class="lc-top">
		<span class="lc-title">{car.title}</span>
		<ScoreBadge {score} size="sm" />
	</div>
	<div class="lc-meta">
		<span class="chip chip-price">€{car.price ? car.price.toLocaleString() : '—'}</span>
		<span class="chip">{car.km ? car.km.toLocaleString() + ' km' : '—'}</span>
		<span class="chip">{car.year ?? '—'}</span>
		<StatusPill status={car.status} />
	</div>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="lc-actions" onclick={(e) => e.stopPropagation()}>
		{#if car.url}
			<a
				href={car.url}
				target="_blank"
				rel="noopener noreferrer"
				class="icon-btn"
				title="Open listing"
			>
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 3H3v10h10v-3M9 1h6v6M7 9L15 1" />
				</svg>
			</a>
		{/if}
		<button type="button" class="icon-btn" onclick={() => onedit?.(car.id)} title="Edit">
			<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
				<path d="M11 2l3 3-8 8H3v-3L11 2z" />
			</svg>
		</button>
		<button type="button" class="icon-btn" onclick={() => ondelete?.(car.id)} title="Delete">
			<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
				<path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" />
			</svg>
		</button>
	</div>
</div>

<style>
	.list-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0.7rem 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.lc-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.lc-title {
		font-weight: 700;
		color: var(--text);
		font-size: 0.9rem;
	}
	.lc-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}
	.chip {
		padding: 3px 9px;
		border-radius: 20px;
		font-size: 0.72rem;
		font-family: var(--mono);
		font-weight: 500;
		background: var(--bg);
		color: var(--text-secondary);
	}
	.chip-price {
		background: var(--green-bg);
		color: var(--green);
		font-weight: 600;
	}
	.lc-actions {
		display: flex;
		gap: 4px;
		justify-content: flex-end;
	}
	.icon-btn {
		background: var(--bg);
		border: 0;
		width: 28px;
		height: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		cursor: pointer;
	}
	.icon-btn:hover {
		background: var(--bg-warm);
		color: var(--text);
	}
	.icon-btn svg {
		width: 14px;
		height: 14px;
	}
</style>
