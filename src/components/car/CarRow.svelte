<script lang="ts">
	import type { Car } from '$lib/types';
	import { computeScore, detectScamRisk } from '$lib/scoring';
	import ScoreBadge from '$components/ui/ScoreBadge.svelte';
	import ScamBadge from '$components/ui/ScamBadge.svelte';
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
	const scam = $derived(detectScamRisk(car));
</script>

<tr onclick={() => onopen?.(car.id)}>
	<td class="title-cell">
		<div class="title-line">
			<span class="title">{car.title}</span>
		</div>
		{#if scam.level !== 'none'}
			<div class="badge-line">
				<ScamBadge {scam} size="sm" />
			</div>
		{/if}
	</td>
	<td class="soft">{car.make ?? '—'}</td>
	<td class="soft">{car.model ?? '—'}</td>
	<td class="soft">{car.location ?? '—'}</td>
	<td class="num">{car.year ?? '—'}</td>
	<td class="num">{car.km ? car.km.toLocaleString('pt-PT') : '—'}</td>
	<td class="price">{car.price ? '€' + car.price.toLocaleString('pt-PT') : '—'}</td>
	<td class="soft">{car.fuel ?? '—'}</td>
	<td><StatusPill status={car.status} /></td>
	<td><ScoreBadge {score} size="sm" /></td>
	<td class="actions-cell" onclick={(e) => e.stopPropagation()}>
		<div class="actions">
			{#if car.url}
				<a
					href={car.url}
					target="_blank"
					rel="noopener noreferrer"
					class="icon-btn"
					title="Open listing"
					aria-label="Open listing"
				>
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M6 3H3v10h10v-3M9 1h6v6M7 9L15 1" />
					</svg>
				</a>
			{/if}
			<button type="button" class="icon-btn" onclick={() => onedit?.(car.id)} title="Edit" aria-label="Edit">
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
					<path d="M11 2l3 3-8 8H3v-3L11 2z" />
				</svg>
			</button>
			<button type="button" class="icon-btn" onclick={() => ondelete?.(car.id)} title="Delete" aria-label="Delete">
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
					<path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" />
				</svg>
			</button>
		</div>
	</td>
</tr>

<style>
	tr {
		cursor: pointer;
	}
	td {
		padding: 12px 14px;
		font-size: 0.82rem;
		color: var(--ink);
		vertical-align: middle;
		height: 60px;
	}
	td.soft {
		color: var(--ink-soft);
	}
	td.num {
		color: var(--ink-soft);
		font-variant-numeric: tabular-nums;
	}
	.title-cell {
		min-width: 200px;
	}
	.title-line {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.title {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--ink);
		letter-spacing: -0.01em;
	}
	.badge-line {
		margin-top: 4px;
	}
	.price {
		font-weight: 600;
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}
	.actions-cell {
		text-align: right;
	}
	.actions {
		display: inline-flex;
		gap: 4px;
		justify-content: flex-end;
		align-items: center;
	}
	.icon-btn {
		background: transparent;
		border: 0;
		width: 26px;
		height: 26px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		color: var(--ink-dim);
		cursor: pointer;
	}
	.icon-btn:hover {
		background: var(--card-2);
		color: var(--ink);
	}
	.icon-btn svg {
		width: 14px;
		height: 14px;
	}
</style>
