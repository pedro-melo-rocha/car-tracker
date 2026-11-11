<script lang="ts">
	import { page } from '$app/state';
	import { goto, replaceState } from '$app/navigation';
	import { cars, carsLoading } from '$lib/stores/cars';
	import {
		filteredListCars,
		listFilters,
		listSort,
		resetListFilters,
		listStateFromParams,
		applyListStateToParams,
		listParamsEqual,
		type ListFilters
	} from '$lib/stores/filters';
	import { deleteCar } from '$lib/stores/cars';
	import { confirmDialog } from '$lib/stores/ui';
	import CarRow from '$components/car/CarRow.svelte';
	import CarRowMobile from '$components/car/CarRowMobile.svelte';
	import SortHeader from '$components/ui/SortHeader.svelte';
	import ColumnFilterPopover from '$components/ui/ColumnFilterPopover.svelte';
	import MobileFiltersSheet from '$components/ui/MobileFiltersSheet.svelte';
	import SkeletonCard from '$components/ui/SkeletonCard.svelte';
	import SkeletonRow from '$components/ui/SkeletonRow.svelte';
	import BulkActionBar from '$components/ui/BulkActionBar.svelte';
	import { bulkSelection, setSelection, clearSelection } from '$lib/stores/bulk';

	function addNewCar() {
		const url = new URL(page.url);
		url.searchParams.set('edit', 'new');
		goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
	}

	let openCol = $state<string | null>(null);
	let mobileOpen = $state(false);
	let hydrated = $state(false);

	$effect(() => {
		if (hydrated) return;
		const { filters, sort } = listStateFromParams(page.url.searchParams);
		listFilters.set(filters);
		listSort.set(sort);
		hydrated = true;
	});

	$effect(() => {
		const f = $listFilters;
		const s = $listSort;
		if (!hydrated) return;
		const next = applyListStateToParams(page.url.searchParams, f, s);
		if (listParamsEqual(next, page.url.searchParams)) return;
		const url = new URL(page.url);
		url.search = next.toString();
		replaceState(url, page.state);
	});

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

	const visibleIds = $derived($filteredListCars.map((c) => c.id));
	const allVisibleSelected = $derived(
		visibleIds.length > 0 && visibleIds.every((id) => $bulkSelection.has(id))
	);
	const someVisibleSelected = $derived(
		visibleIds.some((id) => $bulkSelection.has(id)) && !allVisibleSelected
	);

	function toggleSelectAllVisible() {
		if (allVisibleSelected) clearSelection();
		else setSelection(visibleIds);
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
		{#if $bulkSelection.size === 0 && $filteredListCars.length > 1}
			<span class="hint">Tick 2 to 5 cars to compare them</span>
		{/if}
		{#if activeCount > 0}
			<button type="button" class="clear-btn" onclick={resetListFilters}>
				Clear filters ({activeCount})
			</button>
		{/if}
		<button type="button" class="mobile-filter-btn" onclick={() => (mobileOpen = true)}>
			Filters{activeCount ? ` (${activeCount})` : ''}
		</button>
	</div>

	{#if $carsLoading && $cars.length === 0}
		<div class="list-cards">
			<SkeletonCard count={6} />
		</div>
		<div class="list-table-wrap">
			<table class="list-table">
				<tbody>
					<SkeletonRow count={6} columns={11} />
				</tbody>
			</table>
		</div>
	{:else if $cars.length === 0}
		<div class="empty">
			<p>No cars yet. Paste a listing link to add the first one.</p>
			<button type="button" class="cta" onclick={addNewCar}>Add your first car</button>
		</div>
	{:else if $filteredListCars.length === 0}
		<div class="empty">
			<p>No cars match these filters.</p>
			{#if activeCount > 0}
				<button type="button" class="cta" onclick={resetListFilters}>
					Clear filters ({activeCount})
				</button>
			{/if}
		</div>
	{:else}
		<div class="list-cards">
			{#each $filteredListCars as car (car.id)}
				<CarRowMobile {car} onopen={openDetail} onedit={openEdit} />
			{/each}
		</div>

		<div class="list-table-wrap">
			<table class="list-table">
				<thead>
					<tr>
						<th class="th-select">
							<input
								type="checkbox"
								class="select-all"
								class:visible={$bulkSelection.size > 0}
								checked={allVisibleSelected}
								indeterminate={someVisibleSelected}
								onchange={toggleSelectAllVisible}
								aria-label="Select all visible"
							/>
						</th>
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
						<th><span class="th-inner"><span class="th-label">Model</span></span></th>
						<th><span class="th-inner"><span class="th-label">Location</span></span></th>
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

<BulkActionBar />

<style>
	.list-view {
		padding: 8px 0 24px;
	}
	.filter-bar {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
		position: sticky;
		top: var(--header-h);
		z-index: 20;
		background: var(--bg);
		padding: 8px 0 14px;
	}
	.search {
		flex: 1;
		min-width: 260px;
		padding: 9px 14px;
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: 10px;
		font-size: 0.82rem;
		color: var(--ink);
		outline: none;
	}
	.search:focus {
		border-color: var(--accent);
	}
	.count {
		font-size: 0.78rem;
		color: var(--ink-dim);
	}
	.clear-btn {
		background: transparent;
		border: 1px solid var(--rule);
		padding: 7px 12px;
		border-radius: 8px;
		font-size: 0.76rem;
		color: var(--ink-soft);
		cursor: pointer;
	}
	.clear-btn:hover {
		background: var(--card-2);
		color: var(--ink);
	}
	.mobile-filter-btn {
		display: none;
		background: var(--accent);
		color: #fff;
		border: 0;
		padding: 7px 14px;
		border-radius: 8px;
		font-size: 0.76rem;
		font-weight: 500;
		cursor: pointer;
	}
	.list-cards {
		display: none;
		flex-direction: column;
		gap: 8px;
	}
	.list-table-wrap {
		overflow-x: clip;
		border-radius: var(--radius);
		background: transparent;
	}
	.list-table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0 8px;
	}
	.list-table th {
		background: var(--bg);
		padding: 10px 14px;
		font-size: 0.8rem;
		color: var(--ink-soft);
		font-weight: 600;
		text-align: left;
		border: 0;
		position: sticky;
		top: calc(var(--header-h) + var(--filters-h));
		z-index: 10;
	}
	.th-select {
		width: 36px;
		padding: 10px 4px 10px 12px;
	}
	.select-all {
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: var(--accent);
		opacity: 0;
		transition: opacity var(--dur-fast) var(--ease);
	}
	.select-all.visible,
	.select-all:checked,
	.list-table thead:hover .select-all {
		opacity: 1;
	}
	.th-inner {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		position: relative;
	}
	.th-label {
		font-weight: 500;
	}
	.th-filter {
		background: transparent;
		border: 0;
		width: 18px;
		height: 18px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--ink-dim);
		border-radius: 4px;
		cursor: pointer;
	}
	.th-filter svg {
		width: 11px;
		height: 11px;
	}
	.th-filter:hover {
		background: var(--card-2);
		color: var(--accent);
	}
	.th-filter.active {
		color: var(--accent);
		background: var(--accent-bg);
	}
	.empty {
		text-align: center;
		padding: 64px 16px;
		color: var(--ink-dim);
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.hint {
		font-size: 0.82rem;
		color: var(--ink-soft);
	}
	@media (max-width: 640px) {
		.hint {
			display: none;
		}
	}
	.empty p {
		margin: 0;
		font-size: 0.92rem;
	}
	.empty .cta {
		background: var(--accent);
		color: #fff;
		border: 0;
		padding: 9px 18px;
		border-radius: 8px;
		font-size: 0.82rem;
		font-weight: 500;
		cursor: pointer;
	}
	.empty .cta:hover {
		background: var(--accent-hover);
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
	:global(.list-table tbody tr) {
		background: var(--card);
		transition:
			border-color var(--dur-fast) var(--ease),
			transform var(--dur-fast) var(--ease),
			box-shadow var(--dur-fast) var(--ease);
	}
	:global(.list-table tbody tr > td:first-child) {
		border-left: 1px solid var(--rule);
		border-top-left-radius: var(--radius);
		border-bottom-left-radius: var(--radius);
	}
	:global(.list-table tbody tr > td:last-child) {
		border-right: 1px solid var(--rule);
		border-top-right-radius: var(--radius);
		border-bottom-right-radius: var(--radius);
	}
	:global(.list-table tbody tr > td) {
		border-top: 1px solid var(--rule);
		border-bottom: 1px solid var(--rule);
	}
	:global(.list-table tbody tr:hover > td) {
		border-color: var(--accent);
	}
</style>
