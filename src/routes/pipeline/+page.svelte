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

	const mainStatuses = STATUSES.slice(0, 3);
	const endStatuses = STATUSES.slice(3);

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
		{#each mainStatuses as status (status)}
			{@const list = carsFor(status)}
			<div
				class="pipeline-col"
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
					<span>{STATUS_LABELS[status]}</span>
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
						<div class="empty">—<br />No cars</div>
					{/each}
				</div>
			</div>
		{/each}
		<div class="end-group">
			{#each endStatuses as status (status)}
				{@const list = carsFor(status)}
				<div
					class="pipeline-col end"
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
						<span>{STATUS_LABELS[status]}</span>
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
											options={STATUSES.map((s) => ({
												value: s,
												label: STATUS_LABELS[s]
											}))}
											value={car.status}
											ariaLabel="Move status"
											onchange={(v) => handleStatusChange(car.id, v)}
										/>
									</div>
								{/if}
							</div>
						{:else}
							<div class="empty">—<br />No cars</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.pipeline-view {
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
	.select-slot {
		width: 180px;
	}
	.columns {
		display: grid;
		grid-template-columns: repeat(3, 1fr) auto;
		gap: 0.75rem;
		align-items: flex-start;
	}
	.end-group {
		display: grid;
		grid-template-columns: repeat(2, minmax(180px, 220px));
		gap: 0.75rem;
	}
	.pipeline-col {
		background: var(--bg);
		border-radius: var(--radius-md);
		padding: 0.6rem 0.55rem;
		min-width: 0;
	}
	.pipeline-col.drag-over {
		outline: 2px dashed var(--accent);
	}
	.col-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 0.25rem 0.5rem;
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
	}
	.count {
		background: var(--bg-card);
		padding: 2px 7px;
		border-radius: 999px;
		font-family: var(--mono);
		color: var(--text-muted);
	}
	.col-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 80px;
	}
	.card-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.mobile-status {
		width: 100%;
	}
	.empty {
		text-align: center;
		padding: 1rem;
		color: var(--text-muted);
		font-size: 0.82rem;
		line-height: 1.6;
	}
	@media (max-width: 960px) {
		.columns {
			grid-template-columns: 1fr;
		}
		.end-group {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 640px) {
		.end-group {
			grid-template-columns: 1fr;
		}
		.select-slot {
			width: 100%;
		}
	}
</style>
