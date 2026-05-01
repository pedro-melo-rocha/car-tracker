<script lang="ts">
	import { STATUSES, STATUS_LABELS, type CarStatus } from '$lib/types';
	import { cars } from '$lib/stores/cars';
	import {
		bulkSelection,
		clearSelection,
		bulkUpdateStatus,
		bulkDelete,
		exportCarsToCsv,
		downloadCsv
	} from '$lib/stores/bulk';
	import { confirmDialog } from '$lib/stores/ui';

	let menuOpen = $state(false);
	let menuRef: HTMLDivElement | undefined = $state();

	const selectedIds = $derived([...$bulkSelection]);
	const selectedCount = $derived(selectedIds.length);

	function selectedCars() {
		const ids = new Set(selectedIds);
		return $cars.filter((c) => ids.has(c.id));
	}

	async function changeStatus(status: CarStatus) {
		menuOpen = false;
		await bulkUpdateStatus(selectedIds, status);
	}

	async function handleDelete() {
		const ok = await confirmDialog({
			title: `Delete ${selectedCount} ${selectedCount === 1 ? 'car' : 'cars'}?`,
			message: 'You will have a few seconds to undo.',
			confirmLabel: 'Delete'
		});
		if (!ok) return;
		bulkDelete(selectedIds);
	}

	function handleExport() {
		const csv = exportCarsToCsv(selectedCars());
		const stamp = new Date().toISOString().slice(0, 10);
		downloadCsv(`cars-${stamp}.csv`, csv);
	}

	function onDocClick(e: MouseEvent) {
		if (!menuOpen || !menuRef) return;
		if (!menuRef.contains(e.target as Node)) menuOpen = false;
	}

	$effect(() => {
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	});
</script>

{#if selectedCount > 0}
	<div class="bulk-bar" role="region" aria-label="Bulk actions">
		<span class="count">
			<strong>{selectedCount}</strong> selected
		</span>
		<div class="actions">
			<div class="menu-wrap" bind:this={menuRef}>
				<button type="button" class="btn" onclick={() => (menuOpen = !menuOpen)}>
					Status ▾
				</button>
				{#if menuOpen}
					<div class="menu" role="menu">
						{#each STATUSES as s (s)}
							<button type="button" class="menu-item" onclick={() => changeStatus(s)}>
								{STATUS_LABELS[s]}
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<button type="button" class="btn" onclick={handleExport}>Export CSV</button>
			<button type="button" class="btn danger" onclick={handleDelete}>Delete</button>
			<button type="button" class="btn ghost" onclick={() => clearSelection()}>Clear</button>
		</div>
	</div>
{/if}

<style>
	.bulk-bar {
		position: fixed;
		left: 50%;
		bottom: 1.25rem;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 1rem;
		background: var(--bg-card);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-xl);
		padding: 0.55rem 0.75rem 0.55rem 1rem;
		border-radius: var(--radius-lg);
		z-index: 90;
		animation: slideInUp var(--dur) var(--ease);
	}
	.count {
		font-size: 0.85rem;
		color: var(--ink-soft);
		white-space: nowrap;
	}
	.count strong {
		color: var(--ink);
		font-weight: 600;
	}
	.actions {
		display: flex;
		gap: 0.4rem;
	}
	.btn {
		background: var(--card-2);
		border: 1px solid var(--rule);
		color: var(--ink);
		padding: 0.4rem 0.75rem;
		border-radius: var(--radius-sm);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}
	.btn:hover {
		background: var(--rule);
	}
	.btn.danger {
		color: var(--bad);
		border-color: var(--bad-bg);
	}
	.btn.danger:hover {
		background: var(--bad-bg);
	}
	.btn.ghost {
		background: transparent;
		border-color: transparent;
		color: var(--ink-dim);
	}
	.btn.ghost:hover {
		background: var(--card-2);
		color: var(--ink);
	}
	.menu-wrap {
		position: relative;
	}
	.menu {
		position: absolute;
		bottom: calc(100% + 6px);
		left: 0;
		min-width: 160px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		padding: 4px;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.menu-item {
		text-align: left;
		background: transparent;
		border: 0;
		padding: 0.45rem 0.75rem;
		border-radius: var(--radius-sm);
		font-size: 0.82rem;
		color: var(--ink);
		cursor: pointer;
	}
	.menu-item:hover {
		background: var(--card-2);
	}
	@media (max-width: 640px) {
		.bulk-bar {
			left: 0.5rem;
			right: 0.5rem;
			bottom: 0.75rem;
			transform: none;
			justify-content: space-between;
		}
		.btn {
			padding: 0.5rem 0.65rem;
			font-size: 0.78rem;
		}
	}
</style>
