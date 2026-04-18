<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { cars } from '$lib/stores/cars';
	import {
		filteredListCars,
		listFilters,
		resetListFilters,
		type ListFilters
	} from '$lib/stores/filters';
	import { deleteCar } from '$lib/stores/cars';
	import { confirmDialog } from '$lib/stores/ui';
	import CarRow from '$components/car/CarRow.svelte';
	import CarRowMobile from '$components/car/CarRowMobile.svelte';
	import SortHeader from '$components/ui/SortHeader.svelte';
	import ColumnFilterPopover from '$components/ui/ColumnFilterPopover.svelte';
	import MobileFiltersSheet from '$components/ui/MobileFiltersSheet.svelte';

	let openCol = $state<string | null>(null);
	let mobileOpen = $state(false);

	const uniqueValues = $derived.by(() => {
		const sources = new Set<string>();
		const makes = new Set<string>();
		const statuses = new Set<string>();
		const fuels = new Set<string>();
		for (const c of $cars) {
			if (c.source) sources.add(c.source);
			if (c.make) makes.add(c.make);
			if (c.status) statuses.add(c.status);
			if (c.fuel) fuels.add(c.fuel);
		}
		return {
			sources: [...sources].sort(),
			makes: [...makes].sort(),
			statuses: [...statuses].sort(),
			fuels: [...fuels].sort()
		};
	});

	function openDetail(id: string) {
		const url = new URL(page.url);
		url.searchParams.set('car', id);
		goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
	}

	function openEdit(id: string) {
		const url = new URL(page.url);
		url.searchParams.set('edit', id);
		goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
	}

	async function handleDelete(id: string) {
		const c = $cars.find((x) => x.id === id);
		if (!c) return;
		const ok = await confirmDialog({
			title: 'Delete car',
			message: `Remove "${c.title}" permanently?`,
			confirmLabel: 'Delete'
		});
		if (ok) await deleteCar(id);
	}

	function isActive(col: keyof ListFilters | 'year' | 'km' | 'price' | 'score'): boolean {
		const f = $listFilters;
		if (col === 'sources' || col === 'makes' || col === 'statuses' || col === 'fuels') {
			return (f[col] as string[]).length > 0;
		}
		const mins: Record<string, keyof ListFilters> = {
			year: 'yearMin',
			km: 'kmMin',
			price: 'priceMin',
			score: 'scoreMin'
		};
		const maxs: Record<string, keyof ListFilters> = {
			year: 'yearMax',
			km: 'kmMax',
			price: 'priceMax',
			score: 'scoreMax'
		};
		const mn = mins[col as string];
		const mx = maxs[col as string];
		return mn != null && (f[mn] != null || f[mx] != null);
	}

	const activeCount = $derived.by(() => {
		let n = 0;
		for (const c of ['sources', 'makes', 'statuses', 'fuels', 'year', 'km', 'price', 'score'] as const) {
			if (isActive(c)) n++;
		}
		return n;
	});

	function toggleCol(col: string) {
		openCol = openCol === col ? null : col;
	}
</script>

<div class="list-view">
	<div class="filter-bar">
		<input
			type="text"
			class="search"
			placeholder="Search title, make, model…"
			value={$listFilters.search}
			oninput={(e) =>
				listFilters.update((f) => ({
					...f,
					search: (e.currentTarget as HTMLInputElement).value
				}))}
		/>
		<span class="count">{$filteredListCars.length} of {$cars.length}</span>
		{#if activeCount > 0}
			<button type="button" class="clear-btn" onclick={resetListFilters}>
				Clear filters ({activeCount})
			</button>
		{/if}
		<button type="button" class="mobile-filter-btn" onclick={() => (mobileOpen = true)}>
			Filters{activeCount ? ` (${activeCount})` : ''}
		</button>
	</div>

	{#if $filteredListCars.length === 0}
		<div class="empty">
			<div class="icon">—</div>
			No cars match filters
		</div>
	{:else}
		<div class="list-cards">
			{#each $filteredListCars as car (car.id)}
				<CarRowMobile {car} onopen={openDetail} onedit={openEdit} ondelete={handleDelete} />
			{/each}
		</div>

		<div class="list-table-wrap">
			<table class="list-table">
				<thead>
					<tr>
						<th><span class="th-inner"><span class="th-label">Title</span></span></th>
						<th>
							<span class="th-inner">
								<span class="th-label">Make</span>
								<button
									type="button"
									class="th-filter"
									class:active={isActive('makes')}
									aria-label="Filter Make"
									onclick={() => toggleCol('makes')}
								>
									<svg viewBox="0 0 10 10" fill="currentColor">
										<path d="M1 2h8L6 6v3L4 8V6L1 2z" />
									</svg>
								</button>
								<ColumnFilterPopover
									meta={{
										type: 'categorical',
										key: 'makes',
										title: 'Make',
										options: uniqueValues.makes
									}}
									open={openCol === 'makes'}
									onclose={() => (openCol = null)}
								/>
							</span>
						</th>
						<th>
							<span class="th-inner">
								<span class="th-label">Source</span>
								<button
									type="button"
									class="th-filter"
									class:active={isActive('sources')}
									aria-label="Filter Source"
									onclick={() => toggleCol('sources')}
								>
									<svg viewBox="0 0 10 10" fill="currentColor">
										<path d="M1 2h8L6 6v3L4 8V6L1 2z" />
									</svg>
								</button>
								<ColumnFilterPopover
									meta={{
										type: 'categorical',
										key: 'sources',
										title: 'Source',
										options: uniqueValues.sources
									}}
									open={openCol === 'sources'}
									onclose={() => (openCol = null)}
								/>
							</span>
						</th>
						<th><span class="th-inner"><span class="th-label">Local</span></span></th>
						<th>
							<span class="th-inner">
								<SortHeader label="Year" field="year" />
								<button
									type="button"
									class="th-filter"
									class:active={isActive('year')}
									aria-label="Filter Year"
									onclick={() => toggleCol('year')}
								>
									<svg viewBox="0 0 10 10" fill="currentColor">
										<path d="M1 2h8L6 6v3L4 8V6L1 2z" />
									</svg>
								</button>
								<ColumnFilterPopover
									meta={{
										type: 'range',
										minKey: 'yearMin',
										maxKey: 'yearMax',
										title: 'Year',
										placeholder: ['From', 'To']
									}}
									open={openCol === 'year'}
									onclose={() => (openCol = null)}
								/>
							</span>
						</th>
						<th>
							<span class="th-inner">
								<SortHeader label="Km" field="km" />
								<button
									type="button"
									class="th-filter"
									class:active={isActive('km')}
									aria-label="Filter Km"
									onclick={() => toggleCol('km')}
								>
									<svg viewBox="0 0 10 10" fill="currentColor">
										<path d="M1 2h8L6 6v3L4 8V6L1 2z" />
									</svg>
								</button>
								<ColumnFilterPopover
									meta={{
										type: 'range',
										minKey: 'kmMin',
										maxKey: 'kmMax',
										title: 'Km',
										placeholder: ['Min', 'Max']
									}}
									open={openCol === 'km'}
									onclose={() => (openCol = null)}
								/>
							</span>
						</th>
						<th>
							<span class="th-inner">
								<SortHeader label="Price" field="price" />
								<button
									type="button"
									class="th-filter"
									class:active={isActive('price')}
									aria-label="Filter Price"
									onclick={() => toggleCol('price')}
								>
									<svg viewBox="0 0 10 10" fill="currentColor">
										<path d="M1 2h8L6 6v3L4 8V6L1 2z" />
									</svg>
								</button>
								<ColumnFilterPopover
									meta={{
										type: 'range',
										minKey: 'priceMin',
										maxKey: 'priceMax',
										title: 'Price',
										placeholder: ['Min €', 'Max €']
									}}
									open={openCol === 'price'}
									onclose={() => (openCol = null)}
								/>
							</span>
						</th>
						<th>
							<span class="th-inner">
								<span class="th-label">Fuel</span>
								<button
									type="button"
									class="th-filter"
									class:active={isActive('fuels')}
									aria-label="Filter Fuel"
									onclick={() => toggleCol('fuels')}
								>
									<svg viewBox="0 0 10 10" fill="currentColor">
										<path d="M1 2h8L6 6v3L4 8V6L1 2z" />
									</svg>
								</button>
								<ColumnFilterPopover
									meta={{
										type: 'categorical',
										key: 'fuels',
										title: 'Fuel',
										options: uniqueValues.fuels
									}}
									open={openCol === 'fuels'}
									onclose={() => (openCol = null)}
								/>
							</span>
						</th>
						<th>
							<span class="th-inner">
								<span class="th-label">Status</span>
								<button
									type="button"
									class="th-filter"
									class:active={isActive('statuses')}
									aria-label="Filter Status"
									onclick={() => toggleCol('statuses')}
								>
									<svg viewBox="0 0 10 10" fill="currentColor">
										<path d="M1 2h8L6 6v3L4 8V6L1 2z" />
									</svg>
								</button>
								<ColumnFilterPopover
									meta={{
										type: 'categorical',
										key: 'statuses',
										title: 'Status',
										options: uniqueValues.statuses
									}}
									open={openCol === 'statuses'}
									onclose={() => (openCol = null)}
								/>
							</span>
						</th>
						<th>
							<span class="th-inner">
								<SortHeader label="Score" field="score" />
								<button
									type="button"
									class="th-filter"
									class:active={isActive('score')}
									aria-label="Filter Score"
									onclick={() => toggleCol('score')}
								>
									<svg viewBox="0 0 10 10" fill="currentColor">
										<path d="M1 2h8L6 6v3L4 8V6L1 2z" />
									</svg>
								</button>
								<ColumnFilterPopover
									meta={{
										type: 'range',
										minKey: 'scoreMin',
										maxKey: 'scoreMax',
										title: 'Score',
										placeholder: ['Min', 'Max']
									}}
									open={openCol === 'score'}
									onclose={() => (openCol = null)}
								/>
							</span>
						</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each $filteredListCars as car (car.id)}
						<CarRow {car} onopen={openDetail} onedit={openEdit} ondelete={handleDelete} />
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<MobileFiltersSheet bind:open={mobileOpen} />
</div>

<style>
	.list-view {
		padding: 0.5rem 0;
	}
	.filter-bar {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}
	.search {
		flex: 1;
		min-width: 200px;
		padding: 0.55rem 0.85rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		font-size: var(--fs-sm);
	}
	.count {
		font-size: 0.82rem;
		color: var(--text-muted);
		font-family: var(--mono);
	}
	.clear-btn {
		background: var(--bg-warm);
		border: 0;
		padding: 0.45rem 0.85rem;
		border-radius: var(--radius-sm);
		font-size: 0.78rem;
		color: var(--text-secondary);
		cursor: pointer;
	}
	.mobile-filter-btn {
		display: none;
		background: var(--accent);
		color: #fff;
		border: 0;
		padding: 0.45rem 0.85rem;
		border-radius: var(--radius-sm);
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
	}
	.list-cards {
		display: none;
		flex-direction: column;
		gap: 0.5rem;
	}
	.list-table-wrap {
		overflow-x: auto;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow);
		background: var(--bg-card);
	}
	.list-table {
		width: 100%;
		border-collapse: collapse;
	}
	.list-table th {
		background: var(--bg);
		padding: 10px 12px;
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		font-weight: 700;
		text-align: left;
		border-bottom: 1px solid var(--border);
		position: relative;
	}
	.th-inner {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		position: relative;
	}
	.th-label {
		font-weight: 700;
	}
	.th-filter {
		background: transparent;
		border: 0;
		width: 18px;
		height: 18px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		border-radius: 4px;
		cursor: pointer;
	}
	.th-filter svg {
		width: 11px;
		height: 11px;
	}
	.th-filter:hover {
		background: var(--bg-warm);
		color: var(--accent);
	}
	.th-filter.active {
		color: var(--accent);
		background: var(--accent-light);
	}
	.empty {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-muted);
	}
	.empty .icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}
	@media (max-width: 640px) {
		.list-table-wrap {
			display: none;
		}
		.list-cards {
			display: flex;
		}
		.mobile-filter-btn {
			display: inline-block;
		}
		.clear-btn {
			display: none;
		}
	}
</style>
