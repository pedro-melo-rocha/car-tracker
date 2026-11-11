<script lang="ts">
	import type { Car } from '$lib/types';
	import { cachedScore, detectScamRisk, locationKm } from '$lib/scoring';
	import { netPriceDrop } from '$lib/price';
	import { timeAgo, daysUntilStale } from '$lib/staleness';
	import { cars } from '$lib/stores/cars';
	import ScoreBadge from '$components/ui/ScoreBadge.svelte';
	import StatusPill from '$components/ui/StatusPill.svelte';

	let {
		car,
		draggable = false,
		showStatus = true,
		onopen,
		onedit,
		ondragstart,
		ondragend
	}: {
		car: Car;
		draggable?: boolean;
		/** Hide the status pill where the surrounding column already names the status. */
		showStatus?: boolean;
		onopen?: (id: string) => void;
		onedit?: (id: string) => void;
		ondragstart?: (id: string) => void;
		ondragend?: () => void;
	} = $props();

	const score = $derived(cachedScore(car));
	const scam = $derived(detectScamRisk(car, { peers: $cars }));
	const dropAmount = $derived(netPriceDrop(car.priceHistory));
	const distance = $derived(locationKm(car.location));
	const staleIn = $derived(daysUntilStale(car));
	const kmLabel = $derived(car.km != null && car.km > 0 ? Math.round(car.km / 1000) + 'k\u00A0km' : 'km unknown');
</script>

<div
	class="car-card"
	class:high-risk={scam.level === 'high'}
	{draggable}
	role="listitem"
	ondragstart={(e) => {
		e.dataTransfer?.setData('carId', car.id);
		e.stopPropagation();
		ondragstart?.(car.id);
	}}
	ondragend={() => ondragend?.()}
>
	{#if scam.level === 'high'}
		<div class="scam-strip">
			<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
				<line x1="12" y1="9" x2="12" y2="13" />
				<line x1="12" y1="17" x2="12.01" y2="17" />
			</svg>
			<span>Likely scam: {scam.flags[0]?.label}</span>
		</div>
	{/if}
	<div class="head">
		<ScoreBadge {score} size="md" />
		<div class="head-text">
			<h3 class="title">
				<button type="button" class="open-btn" onclick={() => onopen?.(car.id)}>{car.title}</button>
			</h3>
			<div class="meta">{car.source ?? 'Unknown source'} · added {timeAgo(car.addedAt)}</div>
		</div>
		{#if car.imageUrl}
			<img
				class="thumb"
				src={car.imageUrl}
				alt=""
				loading="lazy"
				onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
			/>
		{/if}
	</div>

	<div class="price-row">
		<span class="price">{car.price ? '€' + car.price.toLocaleString('pt-PT') : 'No price'}</span>
		{#if dropAmount > 0}
			<span class="drop">−€{dropAmount.toLocaleString('pt-PT')}</span>
		{/if}
	</div>

	<div class="facts">
		{kmLabel} · {car.year ?? 'year unknown'} · {car.fuel ?? 'fuel unknown'}
	</div>

	{#if scam.level === 'low'}
		<p class="flag-note">Check: {scam.flags[0]?.label}{scam.flags.length > 1 ? ` (+${scam.flags.length - 1} more)` : ''}</p>
	{/if}

	{#if staleIn != null}
		<p class="stale-note" class:soon={staleIn <= 1}>
			{staleIn === 0
				? 'No reply for 3 days. Moves to Dismissed now.'
				: `No reply yet. Moves to Dismissed in ${staleIn} ${staleIn === 1 ? 'day' : 'days'}.`}
		</p>
	{/if}

	<div class="foot">
		<span class="loc">
			<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M12 22s-7-7.5-7-13a7 7 0 0 1 14 0c0 5.5-7 13-7 13z" />
				<circle cx="12" cy="9" r="2.5" />
			</svg>
			<span class="loc-text">
				{car.location ?? 'No location'}{#if distance != null}<span class="dim">, {distance} km away</span>{/if}
			</span>
		</span>
		<div class="foot-right">
			<button
				type="button"
				class="edit-btn"
				aria-label="Edit {car.title}"
				onclick={() => onedit?.(car.id)}
			>
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M4 20h4L20 8l-4-4L4 16v4z" />
					<line x1="14" y1="6" x2="18" y2="10" />
				</svg>
			</button>
			{#if showStatus}<StatusPill status={car.status} />{/if}
		</div>
	</div>
</div>

<style>
	.car-card {
		position: relative;
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: var(--radius-lg);
		padding: 16px;
		box-shadow: var(--shadow-sm);
		transition:
			transform 160ms var(--ease),
			box-shadow 160ms var(--ease),
			border-color 160ms var(--ease);
	}
	.car-card:hover {
		border-color: var(--border-strong);
		box-shadow: var(--shadow);
	}
	.car-card.high-risk {
		border-color: var(--bad-bg);
	}
	/* The title button stretches over the whole card so any click opens it. */
	.open-btn {
		all: unset;
		cursor: pointer;
	}
	.open-btn::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}
	.open-btn:focus-visible {
		outline: none;
	}
	.open-btn:focus-visible::after {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.thumb {
		width: 56px;
		height: 42px;
		border-radius: 6px;
		object-fit: cover;
		flex-shrink: 0;
		background: var(--card-2);
	}
	.flag-note,
	.stale-note {
		margin-top: 8px;
		font-size: 0.8rem;
		line-height: 1.4;
		color: var(--ink-soft);
	}
	.flag-note {
		color: var(--status-negotiating-fg);
	}
	.stale-note.soon {
		color: var(--bad);
		font-weight: 600;
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
		font-size: 0.78rem;
		color: var(--ink-soft);
		margin-top: 3px;
	}
	.title {
		font-size: 0.94rem;
		font-weight: 600;
		letter-spacing: -0.015em;
		line-height: 1.25;
		color: var(--ink);
		text-wrap: pretty;
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
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--good);
	}
	.scam-strip {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: -16px -16px 12px;
		padding: 7px 14px;
		border-top-left-radius: var(--radius-lg);
		border-top-right-radius: var(--radius-lg);
		font-size: 0.8rem;
		font-weight: 600;
		background: var(--bad-bg);
		color: var(--bad);
	}
	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 8px;
		font-size: 0.82rem;
		color: var(--ink-soft);
		font-variant-numeric: tabular-nums;
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
		font-size: 0.8rem;
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
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}
	.edit-btn {
		background: transparent;
		border: 0;
		width: 28px;
		height: 28px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		color: var(--ink-dim);
		opacity: 1;
		transition:
			opacity var(--dur-fast) var(--ease),
			background var(--dur-fast) var(--ease);
	}
	.edit-btn:hover {
		background: var(--card-2);
		color: var(--ink);
	}
	@media (hover: hover) {
		.edit-btn {
			opacity: 0;
		}
		.car-card:hover .edit-btn,
		.car-card:focus-within .edit-btn {
			opacity: 1;
		}
	}
	@media (hover: none) {
		.edit-btn {
			width: 36px;
			height: 36px;
			opacity: 0.65;
		}
	}
</style>
