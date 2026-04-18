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

<tr onclick={() => onopen?.(car.id)}>
	<td class="title-cell">{car.title}</td>
	<td>{car.make ?? '—'}</td>
	<td>{car.source ?? '—'}</td>
	<td>{car.location ?? '—'}</td>
	<td>{car.year ?? '—'}</td>
	<td class="mono">{car.km ? car.km.toLocaleString() : '—'}</td>
	<td class="mono price">{car.price ? '€' + car.price.toLocaleString() : '—'}</td>
	<td>{car.fuel ?? '—'}</td>
	<td><StatusPill status={car.status} /></td>
	<td><ScoreBadge {score} size="sm" /></td>
	<td class="actions" onclick={(e) => e.stopPropagation()}>
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
	</td>
</tr>

<style>
	tr {
		cursor: pointer;
	}
	tr:hover {
		background: var(--bg-warm);
	}
	td {
		padding: 10px 12px;
		font-size: 0.82rem;
		border-bottom: 1px solid var(--border);
		color: var(--text-secondary);
	}
	.title-cell {
		color: var(--text);
		font-weight: 600;
	}
	.mono {
		font-family: var(--mono);
	}
	.price {
		color: var(--green);
		font-weight: 600;
	}
	.actions {
		display: flex;
		gap: 4px;
		justify-content: flex-end;
	}
	.icon-btn {
		background: transparent;
		border: 0;
		width: 26px;
		height: 26px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		cursor: pointer;
	}
	.icon-btn:hover {
		background: var(--bg);
		color: var(--text);
	}
	.icon-btn svg {
		width: 14px;
		height: 14px;
	}
</style>
