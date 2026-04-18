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

	async function handleDrop(e: DragEvent, status: CarStatus) {
		e.preventDefault();
		draggingOver = null;
		const id = e.dataTransfer?.getData('carId');
		if (!id) return;
		const car = $cars.find((c) => c.id === id);
		if (!car || car.status === status) return;
		await updateCar(id, { status });
	}

	function handleStatusChange(id: string, next: string) {
		updateCar(id, { status: next as CarStatus });
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

	<div class="columns">
		{#each STATUSES as status (status)}
			{@const list = carsFor(status)}
			<div
				class="col"
				class:drag-over={draggingOver === status}
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
				</div>
				<div class="col-body">
					{#each list as car (car.id)}
						<div class="card-wrap">
							<CarCard
								{car}
								draggable={!isMobile}
								onopen={openDetail}
								onedit={openEdit}
							/>
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
		margin-bottom: 16px;
		flex-wrap: wrap;
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
	.col-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 14px;
		padding: 0 4px;
		gap: 8px;
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
		.columns {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	@media (max-width: 960px) {
		.columns {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 640px) {
		.columns {
			grid-template-columns: 1fr;
		}
		.select-slot {
			width: 100%;
		}
	}
</style>
