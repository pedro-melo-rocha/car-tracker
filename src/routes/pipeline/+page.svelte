<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { cars, updateCar } from '$lib/stores/cars';
	import { filteredPipelineCars, pipelineFilter } from '$lib/stores/filters';
	import { STATUSES, STATUS_LABELS, type CarStatus } from '$lib/types';
	import CarCard from '$components/car/CarCard.svelte';
	import CustomSelect from '$components/ui/CustomSelect.svelte';

	let draggingOver = $state<CarStatus | null>(null);
	let isMobile = $state(false);
	let movingIds = $state<Set<string>>(new Set());
	let dismissedCollapsed = $state(true);

	$effect(() => {
		const stored = localStorage.getItem('pipeline.dismissedCollapsed');
		if (stored !== null) dismissedCollapsed = stored === '1';
	});

	$effect(() => {
		localStorage.setItem('pipeline.dismissedCollapsed', dismissedCollapsed ? '1' : '0');
	});

	$effect(() => {
		const mq = window.matchMedia('(max-width: 640px)');
		const upd = () => (isMobile = mq.matches);
		upd();
		mq.addEventListener('change', upd);
		return () => mq.removeEventListener('change', upd);
	});

	const sourceOptions = $derived.by(() => {
		const set = new Set<string>();
		for (const c of $cars) if (c.source) set.add(c.source);
		return [
			{ value: '', label: 'All sources' },
			...[...set].sort().map((s) => ({ value: s, label: s }))
		];
	});

	const fuelOptions = [
		{ value: '', label: 'All fuels' },
		{ value: 'Diesel', label: 'Diesel' },
		{ value: 'Gasolina', label: 'Gasolina' }
	];

	function carsFor(status: CarStatus) {
		return $filteredPipelineCars.filter((c) => c.status === status);
	}

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

	async function moveCar(id: string, nextStatus: CarStatus) {
		const car = $cars.find((c) => c.id === id);
		if (!car || car.status === nextStatus) return;
		if (movingIds.has(id)) return;
		const previousStatus = car.status;

		movingIds = new Set(movingIds).add(id);
		cars.update((list) =>
			list.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
		);

		try {
			await updateCar(id, { status: nextStatus });
		} catch {
			cars.update((list) =>
				list.map((c) => (c.id === id ? { ...c, status: previousStatus } : c))
			);
		} finally {
			const next = new Set(movingIds);
			next.delete(id);
			movingIds = next;
		}
	}

	async function handleDrop(e: DragEvent, status: CarStatus) {
		e.preventDefault();
		draggingOver = null;
		const id = e.dataTransfer?.getData('carId');
		if (!id) return;
		await moveCar(id, status);
	}

	function handleStatusChange(id: string, next: string) {
		void moveCar(id, next as CarStatus);
	}
</script>

<div class="pipeline-view">
	<div class="filter-bar">
		<input
			type="text"
			class="search"
			placeholder="Search title, make, model…"
			value={$pipelineFilter.search}
			oninput={(e) =>
				pipelineFilter.update((f) => ({
					...f,
					search: (e.currentTarget as HTMLInputElement).value
				}))}
		/>
		<div class="select-slot">
			<CustomSelect
				options={sourceOptions}
				placeholder="All sources"
				value={$pipelineFilter.source}
				onchange={(v) => pipelineFilter.update((f) => ({ ...f, source: v }))}
			/>
		</div>
		<div class="select-slot">
			<CustomSelect
				options={fuelOptions}
				placeholder="All fuels"
				value={$pipelineFilter.fuel}
				onchange={(v) => pipelineFilter.update((f) => ({ ...f, fuel: v }))}
			/>
		</div>
	</div>

	<div class="columns" class:dismissed-collapsed={dismissedCollapsed}>
		{#each STATUSES as status (status)}
			{@const list = carsFor(status)}
			{@const isDismissed = status === 'dismissed'}
			{@const collapsed = isDismissed && dismissedCollapsed}
			<div
				class="col"
				class:drag-over={draggingOver === status}
				class:dismissed-col={isDismissed}
				class:collapsed
				ondragover={(e) => {
					e.preventDefault();
					draggingOver = status;
				}}
				ondragleave={() => (draggingOver = null)}
				ondrop={(e) => handleDrop(e, status)}
				role="list"
			>
				<div class="col-head">
					<span class="col-label">{STATUS_LABELS[status]}</span>
					<span class="count">{list.length}</span>
					{#if isDismissed}
						<button
							type="button"
							class="collapse-btn"
							onclick={() => (dismissedCollapsed = !dismissedCollapsed)}
							aria-label={collapsed ? 'Expand dismissed column' : 'Collapse dismissed column'}
							aria-expanded={!collapsed}
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								{#if collapsed}
									<polyline points="9 18 15 12 9 6"></polyline>
								{:else}
									<polyline points="15 18 9 12 15 6"></polyline>
								{/if}
							</svg>
						</button>
					{/if}
				</div>
				{#if !collapsed}
				<div class="col-body">
					{#each list as car (car.id)}
						{@const moving = movingIds.has(car.id)}
						<div class="card-wrap" class:moving>
							<div class="card-shell">
								<CarCard
									{car}
									draggable={!isMobile && !moving}
									onopen={openDetail}
									onedit={openEdit}
								/>
								{#if moving}
									<div class="move-overlay" aria-live="polite">
										<div class="spinner" aria-hidden="true"></div>
										<span class="sr-only">Moving…</span>
									</div>
								{/if}
							</div>
							{#if isMobile}
								<div class="mobile-status">
									<CustomSelect
										options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
										value={car.status}
										ariaLabel="Move status"
										onchange={(v) => handleStatusChange(car.id, v)}
									/>
								</div>
							{/if}
						</div>
					{:else}
						<div class="empty">No cars</div>
					{/each}
				</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.pipeline-view {
		padding: 8px 0 24px;
	}
	.filter-bar {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
		position: sticky;
		top: var(--header-h);
		z-index: 20;
		background: var(--bg);
		padding: 8px 0 16px;
	}
	.search {
		flex: 1;
		min-width: 200px;
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
	.select-slot {
		width: 180px;
	}
	.columns {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 16px;
		align-items: flex-start;
	}
	.columns.dismissed-collapsed {
		grid-template-columns:
			minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 56px minmax(0, 1fr);
	}
	.col {
		background: var(--card-2);
		border-radius: 16px;
		padding: 14px;
		min-width: 0;
		min-height: 400px;
		transition: background var(--dur-fast) var(--ease);
	}
	.col.drag-over {
		background: var(--accent-bg);
	}
	.col.collapsed {
		min-height: 0;
		padding: 0;
	}
	.col.collapsed .col-head {
		margin: 0;
		padding: 12px 8px;
		flex-direction: column;
		gap: 10px;
		border-radius: 16px;
		position: static;
	}
	.col.collapsed .col-label {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		font-size: 0.78rem;
	}
	.collapse-btn {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		background: var(--card);
		color: var(--ink-soft);
		border: 1px solid var(--rule);
		border-radius: 8px;
		cursor: pointer;
		transition: background var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease);
	}
	.collapse-btn:hover {
		background: var(--bg-warm);
		color: var(--ink);
	}
	.col.collapsed .collapse-btn {
		margin-left: 0;
	}
	.col-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		position: sticky;
		top: calc(var(--header-h) + var(--filters-h));
		z-index: 15;
		background: var(--card-2);
		margin: -14px -14px 10px;
		padding: 12px 18px 10px;
		border-radius: 16px 16px 0 0;
	}
	.col-label {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.count {
		background: var(--card);
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 0.72rem;
		color: var(--ink-dim);
		flex-shrink: 0;
	}
	.col-body {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.card-wrap {
		display: flex;
		flex-direction: column;
		gap: 6px;
		animation: cardSlideIn 180ms var(--ease);
	}
	.card-wrap.moving .card-shell {
		pointer-events: none;
	}
	.card-shell {
		position: relative;
	}
	.move-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in oklab, var(--card) 72%, transparent);
		backdrop-filter: blur(1px);
		-webkit-backdrop-filter: blur(1px);
		border-radius: var(--radius-lg);
		animation: fadeIn 120ms var(--ease);
		z-index: 2;
	}
	.move-overlay .spinner {
		width: 22px;
		height: 22px;
		border: 2px solid var(--border-strong);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 800ms linear infinite;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}
	@keyframes cardSlideIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.mobile-status {
		width: 100%;
	}
	.empty {
		text-align: center;
		padding: 16px 8px;
		color: var(--ink-dim);
		font-size: 0.78rem;
	}
	@media (max-width: 1200px) {
		.columns,
		.columns.dismissed-collapsed {
			grid-template-columns: repeat(3, 1fr);
		}
		.col.collapsed .col-head {
			flex-direction: row;
		}
		.col.collapsed .col-label {
			writing-mode: horizontal-tb;
			transform: none;
		}
	}
	@media (max-width: 960px) {
		.columns,
		.columns.dismissed-collapsed {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 640px) {
		.columns,
		.columns.dismissed-collapsed {
			grid-template-columns: 1fr;
		}
		.select-slot {
			width: 100%;
		}
	}
</style>
