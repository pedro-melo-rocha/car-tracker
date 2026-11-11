<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { cars } from '$lib/stores/cars';
	import { compareIds, clearCompare, compareHref } from '$lib/stores/compare';
	import { bulkSelection } from '$lib/stores/bulk';

	// Drop ids of cars that were deleted since they were picked.
	const picked = $derived($compareIds.filter((id) => $cars.some((c) => c.id === id)));
	const hidden = $derived(picked.length === 0 || $bulkSelection.size > 0);

	function open() {
		goto(compareHref(page.url, picked), { keepFocus: true, noScroll: true });
	}
</script>

{#if !hidden}
	<div class="tray" role="region" aria-label="Comparison">
		<span class="count">
			<strong>{picked.length}</strong>
			{picked.length === 1 ? 'car picked to compare' : 'cars picked to compare'}
		</span>
		<button type="button" class="btn primary" onclick={open} disabled={picked.length < 2}>
			Compare
		</button>
		<button type="button" class="btn ghost" onclick={clearCompare}>Clear</button>
	</div>
{/if}

<style>
	.tray {
		position: fixed;
		left: 50%;
		bottom: 1.25rem;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: var(--card);
		border: 1px solid var(--rule);
		box-shadow: var(--shadow-xl);
		padding: 0.5rem 0.6rem 0.5rem 1rem;
		border-radius: var(--radius-lg);
		z-index: 55;
		animation: slideInUp var(--dur) var(--ease);
	}
	.count {
		font-size: 0.85rem;
		color: var(--ink-soft);
		white-space: nowrap;
	}
	.count strong {
		color: var(--ink);
	}
	.btn {
		border: 1px solid transparent;
		padding: 0.45rem 0.85rem;
		border-radius: var(--radius-sm);
		font-size: 0.82rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.btn.primary {
		background: var(--accent);
		color: #fff;
	}
	.btn.primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}
	.btn.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn.ghost {
		background: transparent;
		color: var(--ink-soft);
	}
	.btn.ghost:hover {
		background: var(--card-2);
		color: var(--ink);
	}
	@media (max-width: 640px) {
		.tray {
			left: 0.5rem;
			right: 0.5rem;
			bottom: 0.75rem;
			transform: none;
		}
		.count {
			flex: 1;
			white-space: normal;
		}
	}
</style>
