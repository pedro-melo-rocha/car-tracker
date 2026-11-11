<script lang="ts">
	import type { Car } from '$lib/types';
	import { cachedScore, detectScamRisk } from '$lib/scoring';
	import { cars } from '$lib/stores/cars';
	import { bulkSelection, toggleSelection } from '$lib/stores/bulk';
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

	const score = $derived(cachedScore(car));
	const scam = $derived(detectScamRisk(car, { peers: $cars }));
	const selected = $derived($bulkSelection.has(car.id));
	const anySelected = $derived($bulkSelection.size > 0);
</script>

<tr class:selected onclick={() => onopen?.(car.id)}>
	<td class="select-cell" onclick={(e) => e.stopPropagation()}>
		<input
			type="checkbox"
			class="select-cb"
			class:visible={anySelected}
			checked={selected}
			onchange={() => toggleSelection(car.id)}
			aria-label="Select {car.title}"
		/>
	</td>
	<td class="title-cell">
		<div class="title-wrap">
			{#if car.imageUrl}
				<img
					class="thumb"
					src={car.imageUrl}
					alt=""
					loading="lazy"
					onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
				/>
			{/if}
			<div class="title-stack">
				<button type="button" class="title" onclick={(e) => { e.stopPropagation(); onopen?.(car.id); }}>{car.title}</button>
				{#if scam.level !== 'none'}
					<div class="badge-line">
						<ScamBadge {scam} size="sm" />
					</div>
				{/if}
			</div>
		</div>
	</td>
	<td class="soft">{car.make ?? '–'}</td>
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
	.select-cell {
		width: 36px;
		padding: 12px 4px 12px 12px;
	}
	.select-cb {
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: var(--accent);
		opacity: 0.55;
		transition: opacity var(--dur-fast) var(--ease);
	}
	.select-cb.visible,
	.select-cb:checked,
	.select-cb:focus-visible,
	tr:hover .select-cb {
		opacity: 1;
	}
	tr.selected {
		background: var(--accent-soft);
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
	.title-wrap {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.title-stack {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.thumb {
		width: 56px;
		height: 40px;
		border-radius: 6px;
		object-fit: cover;
		flex-shrink: 0;
		background: var(--card-2);
	}
	.title {
		all: unset;
		cursor: pointer;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--ink);
		letter-spacing: -0.01em;
	}
	.title:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.title:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
		border-radius: 2px;
	}
	.badge-line {
		display: flex;
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
