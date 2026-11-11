<script lang="ts">
	import type { Car } from '$lib/types';
	import { cachedScore } from '$lib/scoring';
	import { bulkSelection, toggleSelection } from '$lib/stores/bulk';
	import ScoreBadge from '$components/ui/ScoreBadge.svelte';
	import StatusPill from '$components/ui/StatusPill.svelte';

	let {
		car,
		onopen,
		onedit,
	}: {
		car: Car;
		onopen?: (id: string) => void;
		onedit?: (id: string) => void;
	} = $props();

	const score = $derived(cachedScore(car));
	const selected = $derived($bulkSelection.has(car.id));
</script>

<div class="list-card" class:selected>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<label class="select-wrap" onclick={(e) => e.stopPropagation()}>
		<input
			type="checkbox"
			checked={selected}
			onchange={() => toggleSelection(car.id)}
			aria-label="Select {car.title}"
		/>
	</label>
	<div class="lc-top">
		<ScoreBadge {score} size="sm" />
		{#if car.imageUrl}
			<img
				class="lc-thumb"
				src={car.imageUrl}
				alt=""
				loading="lazy"
				onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
			/>
		{/if}
		<div class="lc-title-block">
			<div class="lc-meta">{car.source ?? 'Unknown source'}</div>
			<button type="button" class="lc-title" onclick={() => onopen?.(car.id)}>{car.title}</button>
		</div>
	</div>
	<div class="lc-price-row">
		<span class="lc-price">{car.price ? '€' + car.price.toLocaleString('pt-PT') : '—'}</span>
		<span class="lc-facts">
			{car.km ? Math.round(car.km / 1000) + 'k km' : '—'} · {car.year ?? '—'} · {car.fuel ?? '—'}
		</span>
	</div>
	<div class="lc-foot">
		<StatusPill status={car.status} />
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="lc-actions" role="presentation" onclick={(e) => e.stopPropagation()}>
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
		</div>
	</div>
</div>

<style>
	.list-card {
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		cursor: pointer;
		position: relative;
	}
	.list-card.selected {
		background: var(--accent-soft);
		border-color: var(--accent);
	}
	.lc-title::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}
	.lc-title:focus-visible::after {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.lc-actions {
		position: relative;
		z-index: 1;
	}
	.select-wrap {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 1;
	}
	.select-wrap input {
		width: 18px;
		height: 18px;
		accent-color: var(--accent);
		cursor: pointer;
	}
	.lc-top {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}
	.lc-title-block {
		flex: 1;
		min-width: 0;
	}
	.lc-thumb {
		width: 56px;
		height: 40px;
		border-radius: 6px;
		object-fit: cover;
		flex-shrink: 0;
		background: var(--card-2);
	}
	.lc-meta {
		font-size: 0.78rem;
		color: var(--ink-soft);
		margin-bottom: 2px;
	}
	.lc-title {
		all: unset;
		cursor: pointer;
		display: block;
		font-weight: 600;
		color: var(--ink);
		font-size: 0.9rem;
		letter-spacing: -0.01em;
	}
	.lc-price-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}
	.lc-price {
		font-size: 1.15rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--ink);
	}
	.lc-facts {
		font-size: 0.76rem;
		color: var(--ink-soft);
	}
	.lc-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		padding-top: 10px;
		border-top: 1px solid var(--rule);
	}
	.lc-actions {
		display: flex;
		gap: 4px;
	}
	.icon-btn {
		background: transparent;
		border: 0;
		width: 28px;
		height: 28px;
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
	@media (hover: none) {
		.icon-btn {
			width: 38px;
			height: 38px;
		}
		.icon-btn svg {
			width: 16px;
			height: 16px;
		}
	}
</style>
