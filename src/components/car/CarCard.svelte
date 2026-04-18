<script lang="ts">
	import type { Car } from '$lib/types';
	import { computeScore, locationKm } from '$lib/scoring';
	import { netPriceDrop } from '$lib/price';
	import { timeAgo } from '$lib/staleness';
	import ScoreBadge from '$components/ui/ScoreBadge.svelte';
	import StatusPill from '$components/ui/StatusPill.svelte';

	let {
		car,
		draggable = false,
		onopen,
		onedit,
		ondragstart,
		ondragend
	}: {
		car: Car;
		draggable?: boolean;
		onopen?: (id: string) => void;
		onedit?: (id: string) => void;
		ondragstart?: (id: string) => void;
		ondragend?: () => void;
	} = $props();

	const score = $derived(computeScore(car));
	const dropAmount = $derived(netPriceDrop(car.priceHistory));
	const distance = $derived(locationKm(car.location));
	const kmLabel = $derived(car.km != null ? Math.round(car.km / 1000) + 'k\u00A0km' : '—');
</script>

<div
	class="car-card"
	role="button"
	tabindex="0"
	{draggable}
	onclick={() => onopen?.(car.id)}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onopen?.(car.id);
		}
	}}
	ondragstart={(e) => {
		e.dataTransfer?.setData('carId', car.id);
		e.stopPropagation();
		ondragstart?.(car.id);
	}}
	ondragend={() => ondragend?.()}
>
	<div class="head">
		<ScoreBadge {score} size="md" />
		<div class="head-text">
			<div class="meta">
				{car.source ?? '—'} · {timeAgo(car.addedAt)}
			</div>
			<h3 class="title">{car.title}</h3>
		</div>
	</div>

	<div class="price-row">
		<span class="price">{car.price ? '€' + car.price.toLocaleString('pt-PT') : '—'}</span>
		{#if dropAmount > 0}
			<span class="drop">
				<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
					<polyline points="16 17 22 17 22 11" />
				</svg>
				€{dropAmount.toLocaleString('pt-PT')} off
			</span>
		{/if}
	</div>

	<div class="facts">
		<span>{kmLabel}</span>
		<span class="dot">·</span>
		<span>{car.year ?? '—'}</span>
		<span class="dot">·</span>
		<span>{car.fuel ?? '—'}</span>
	</div>

	<div class="foot">
		<span class="loc">
			<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M12 22s-7-7.5-7-13a7 7 0 0 1 14 0c0 5.5-7 13-7 13z" />
				<circle cx="12" cy="9" r="2.5" />
			</svg>
			<span class="loc-text">
				{car.location ?? '—'}
				{#if distance != null}<span class="dim"> · {distance}km</span>{/if}
			</span>
		</span>
		<div class="foot-right">
			<button
				type="button"
				class="edit-btn"
				aria-label="Edit car"
				onclick={(e) => {
					e.stopPropagation();
					onedit?.(car.id);
				}}
			>
				<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M4 20h4L20 8l-4-4L4 16v4z" />
					<line x1="14" y1="6" x2="18" y2="10" />
				</svg>
			</button>
			<StatusPill status={car.status} />
		</div>
	</div>
</div>

<style>
	.car-card {
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: var(--radius-lg);
		padding: 16px;
		cursor: pointer;
		box-shadow: var(--shadow-sm);
		transition:
			transform 160ms var(--ease),
			box-shadow 160ms var(--ease),
			border-color 160ms var(--ease);
	}
	.car-card:hover {
		transform: translateY(-1px);
		box-shadow: var(--shadow-lg);
	}
	.car-card:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.head {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}
	.head-text {
		flex: 1;
		min-width: 0;
	}
	.meta {
		font-size: 0.68rem;
		color: var(--ink-dim);
		margin-bottom: 2px;
	}
	.title {
		font-size: 0.94rem;
		font-weight: 600;
		letter-spacing: -0.015em;
		line-height: 1.25;
		color: var(--ink);
	}
	.price-row {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin-top: 12px;
	}
	.price {
		font-size: 1.35rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--ink);
	}
	.drop {
		font-size: 0.68rem;
		color: var(--good);
		display: inline-flex;
		align-items: center;
		gap: 3px;
	}
	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 8px;
		font-size: 0.76rem;
		color: var(--ink-soft);
	}
	.facts .dot {
		color: var(--ink-dim);
	}
	.foot {
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--rule);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}
	.loc {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.76rem;
		color: var(--ink-soft);
		min-width: 0;
		overflow: hidden;
	}
	.loc-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.dim {
		color: var(--ink-dim);
	}
	.foot-right {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}
	.edit-btn {
		background: transparent;
		border: 0;
		width: 22px;
		height: 22px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		color: var(--ink-dim);
		opacity: 0;
		transition: opacity var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
	}
	.car-card:hover .edit-btn,
	.car-card:focus-within .edit-btn {
		opacity: 1;
	}
	.edit-btn:hover {
		background: var(--card-2);
		color: var(--ink);
	}
</style>
