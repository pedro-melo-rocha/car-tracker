<script lang="ts">
	import type { Car } from '$lib/types';
	import { computeScore } from '$lib/scoring';
	import ScoreBadge from '$components/ui/ScoreBadge.svelte';

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
	const notesPreview = $derived(
		car.notes ? (car.notes.length > 80 ? car.notes.slice(0, 80) + '...' : car.notes) : ''
	);
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
	<div class="card-header">
		<span class="card-title">{car.title}</span>
		{#if car.source}
			<span class="source-tag">{car.source}</span>
		{/if}
	</div>
	<div class="card-chips">
		<span class="chip">{car.year ?? '—'}</span>
		<span class="chip">{car.km ? car.km.toLocaleString() + ' km' : '—'}</span>
		<span class="chip">{car.fuel ?? '—'}</span>
		<span class="chip chip-price">€{car.price ? car.price.toLocaleString() : '—'}</span>
		<ScoreBadge {score} size="sm" />
	</div>
	{#if car.location}
		<div class="card-notes" style="margin-bottom:6px;">📍 {car.location}</div>
	{/if}
	{#if notesPreview}
		<div class="card-notes">{notesPreview}</div>
	{/if}
	<div class="card-actions">
		<button
			type="button"
			class="card-btn"
			onclick={(e) => {
				e.stopPropagation();
				onedit?.(car.id);
			}}>Edit</button
		>
	</div>
</div>

<style>
	.car-card {
		background: var(--bg-card);
		border-radius: var(--radius-md);
		padding: 12px 14px;
		border: 1px solid var(--border);
		cursor: pointer;
		transition: border-color var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
	}
	.car-card:hover {
		border-color: var(--border-strong);
	}
	.card-header {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		align-items: flex-start;
		margin-bottom: 8px;
	}
	.card-title {
		font-size: 0.88rem;
		font-weight: 700;
		flex: 1;
		letter-spacing: -0.02em;
		line-height: 1.3;
		color: var(--text);
	}
	.source-tag {
		background: var(--blue-bg);
		color: var(--blue);
		padding: 3px 8px;
		border-radius: 20px;
		font-size: 0.68rem;
		font-weight: 600;
		white-space: nowrap;
		letter-spacing: -0.01em;
		flex-shrink: 0;
	}
	.card-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-bottom: 10px;
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
		box-shadow: inset 0 0 0 1px rgba(45, 139, 111, 0.12);
	}
	.card-notes {
		font-size: 0.78rem;
		color: var(--text-muted);
		margin-bottom: 10px;
		line-height: 1.45;
		letter-spacing: -0.01em;
	}
	.card-actions {
		display: flex;
		gap: 5px;
	}
	.card-btn {
		background: var(--bg);
		border: none;
		color: var(--text-muted);
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		font-size: 0.72rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}
	.card-btn:hover {
		background: var(--bg-warm);
		color: var(--text-secondary);
	}
</style>
