<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { cars } from '$lib/stores/cars';
	import { compareIds, toggleCompare, clearCompare } from '$lib/stores/compare';
	import { computeScore, computeScoreBreakdown, scoreClass, locationKm } from '$lib/scoring';
	import type { Car } from '$lib/types';

	let filter = $state('');

	const comparable = $derived(
		$cars
			.filter((c) => c.status !== 'dismissed')
			.map((c) => ({ car: c, score: computeScore(c) }))
			.sort((a, b) => b.score - a.score)
	);

	const visible = $derived.by(() => {
		const needle = filter.trim().toLowerCase();
		if (!needle) return comparable;
		return comparable.filter(({ car }) => {
			const hay = [car.title, car.make, car.model].filter(Boolean).join(' ').toLowerCase();
			return hay.includes(needle);
		});
	});

	const selected = $derived($cars.filter((c) => $compareIds.includes(c.id)));
	const atLimit = $derived($compareIds.length >= 5);

	const scoresByCar = $derived(
		new Map(selected.map((c) => [c.id, computeScore(c)] as const))
	);

	const topScore = $derived(
		selected.length ? Math.max(...selected.map((c) => scoresByCar.get(c.id) ?? 0)) : 0
	);
	const tied = $derived(selected.filter((c) => (scoresByCar.get(c.id) ?? 0) === topScore));
	const winnerId = $derived.by(() => {
		if (tied.length <= 1) return tied[0]?.id;
		const sorted = [...tied].sort((a, b) => {
			const pa = a.price ?? Infinity;
			const pb = b.price ?? Infinity;
			if (pa !== pb) return pa - pb;
			const ka = a.km ?? Infinity;
			const kb = b.km ?? Infinity;
			return ka - kb;
		});
		return sorted[0]?.id;
	});

	function openDetail(id: string) {
		const url = new URL(page.url);
		url.searchParams.set('car', id);
		goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
	}

	function fmtPrice(c: Car) {
		if (!c.price) return '—';
		const epm = c.km ? ` · €${(c.price / c.km).toFixed(3)}/km` : '';
		return `€${c.price.toLocaleString()}${epm}`;
	}

	function fmtKm(c: Car) {
		return c.km ? c.km.toLocaleString() + ' km' : '—';
	}

	function fmtYear(c: Car) {
		if (!c.year) return '—';
		const age = new Date().getFullYear() - c.year;
		return `${c.year} · ${age} yrs`;
	}

	function fmtEngine(c: Car) {
		const parts = [c.engine, c.power ? c.power + 'cv' : ''].filter(Boolean);
		return parts.length ? parts.join(' · ') : '—';
	}

	function fmtLocation(c: Car) {
		const dist = locationKm(c.location);
		const parts = [c.location, dist != null ? `${dist} km` : ''].filter(Boolean);
		return parts.length ? parts.join(' · ') : '—';
	}
</script>

<div class="compare-view">
	<div class="filter-bar">
		<input
			type="text"
			class="search"
			placeholder="Filter cars to pick…"
			bind:value={filter}
		/>
		<span class="count">{$compareIds.length}/5 selected</span>
		{#if $compareIds.length > 0}
			<button type="button" class="clear-btn" onclick={clearCompare}>Clear</button>
		{/if}
	</div>

	<div class="selectors">
		{#if visible.length === 0}
			<div class="empty-inline">No cars match your filter.</div>
		{:else}
			{#each visible as { car } (car.id)}
				{@const isSelected = $compareIds.includes(car.id)}
				{@const disabled = !isSelected && atLimit}
				<button
					type="button"
					class="compare-toggle"
					class:active={isSelected}
					class:disabled
					title={disabled ? 'Max 5 cars to compare' : ''}
					onclick={() => toggleCompare(car.id)}
				>
					{car.title}
				</button>
			{/each}
		{/if}
	</div>

	{#if selected.length < 2}
		<div class="empty">
			<div class="icon">↔</div>
			{selected.length === 0
				? 'Tap cars above to add them to the comparison. Pick at least 2 (up to 5).'
				: `Pick ${2 - selected.length} more car${selected.length === 1 ? '' : 's'} above to start comparing.`}
		</div>
	{:else}
		<div class="table-wrap">
			<table class="compare-table">
				<thead>
					<tr>
						<th></th>
						{#each selected as c (c.id)}
							<th class:winner={c.id === winnerId}>
								<button type="button" class="header-btn" onclick={() => openDetail(c.id)}>
									{c.title}
								</button>
								<button
									type="button"
									class="remove-btn"
									aria-label="Remove from compare"
									onclick={() => toggleCompare(c.id)}>×</button
								>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					<tr>
						<th class="row-label">Score</th>
						{#each selected as c (c.id)}
							{@const s = scoresByCar.get(c.id) ?? 0}
							<td
								><span class="chip-score {scoreClass(s)}">{s}</span>
								{#if c.id === winnerId}
									<span class="winner-tag">Winner</span>
								{/if}
							</td>
						{/each}
					</tr>
					<tr>
						<th class="row-label">Price</th>
						{#each selected as c (c.id)}
							<td>{fmtPrice(c)}</td>
						{/each}
					</tr>
					<tr>
						<th class="row-label">Km</th>
						{#each selected as c (c.id)}
							<td>{fmtKm(c)}</td>
						{/each}
					</tr>
					<tr>
						<th class="row-label">Year</th>
						{#each selected as c (c.id)}
							<td>{fmtYear(c)}</td>
						{/each}
					</tr>
					<tr>
						<th class="row-label">Fuel</th>
						{#each selected as c (c.id)}
							<td>{c.fuel ?? '—'}</td>
						{/each}
					</tr>
					<tr>
						<th class="row-label">Engine</th>
						{#each selected as c (c.id)}
							<td>{fmtEngine(c)}</td>
						{/each}
					</tr>
					<tr>
						<th class="row-label">Location</th>
						{#each selected as c (c.id)}
							<td>{fmtLocation(c)}</td>
						{/each}
					</tr>
					<tr>
						<th class="row-label">Source</th>
						{#each selected as c (c.id)}
							<td>{c.source ?? '—'}</td>
						{/each}
					</tr>
					<tr>
						<th class="row-label">Reliability</th>
						{#each selected as c (c.id)}
							{@const rel = computeScoreBreakdown(c).rel}
							<td>{rel.score}{rel.reason ? ` · ${rel.reason}` : ''}</td>
						{/each}
					</tr>
					<tr>
						<th class="row-label">Notes</th>
						{#each selected as c (c.id)}
							<td class="notes">{c.notes ?? '—'}</td>
						{/each}
					</tr>
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.compare-view {
		padding: 0.5rem 0;
	}
	.filter-bar {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.75rem;
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
		cursor: pointer;
	}
	.selectors {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 1rem;
	}
	.compare-toggle {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0.35rem 0.75rem;
		font-size: 0.78rem;
		color: var(--text-secondary);
		cursor: pointer;
	}
	.compare-toggle:hover {
		background: var(--bg-warm);
		color: var(--text);
	}
	.compare-toggle.active {
		background: var(--accent);
		color: #fff;
		border-color: var(--accent);
	}
	.compare-toggle.disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.empty-inline {
		color: var(--text-muted);
		font-size: 0.82rem;
		padding: 0.5rem;
	}
	.empty {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-muted);
	}
	.empty .icon {
		font-size: 1.75rem;
		margin-bottom: 0.5rem;
	}
	.table-wrap {
		overflow-x: auto;
		border-radius: var(--radius-md);
		background: var(--bg-card);
		box-shadow: var(--shadow);
	}
	.compare-table {
		width: 100%;
		border-collapse: collapse;
	}
	.compare-table th,
	.compare-table td {
		padding: 10px 14px;
		font-size: 0.85rem;
		border-bottom: 1px solid var(--border);
		color: var(--text-secondary);
		vertical-align: top;
		text-align: left;
	}
	.compare-table thead th {
		background: var(--bg);
		position: relative;
	}
	.compare-table thead th.winner {
		background: var(--green-bg);
	}
	.header-btn {
		background: transparent;
		border: 0;
		font-weight: 700;
		color: var(--text);
		text-align: left;
		cursor: pointer;
		padding: 0;
	}
	.header-btn:hover {
		color: var(--accent);
	}
	.remove-btn {
		position: absolute;
		top: 6px;
		right: 8px;
		background: transparent;
		border: 0;
		font-size: 1.1rem;
		line-height: 1;
		color: var(--text-muted);
		cursor: pointer;
	}
	.row-label {
		color: var(--text-muted);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: var(--bg);
		white-space: nowrap;
	}
	.notes {
		white-space: pre-wrap;
	}
	.winner-tag {
		display: inline-block;
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: var(--green);
		color: #fff;
		padding: 2px 7px;
		border-radius: 999px;
		margin-left: 6px;
	}
	.chip-score {
		font-weight: 700;
		padding: 3px 11px;
		border-radius: 999px;
		font-family: var(--mono);
		box-shadow: inset 0 0 0 1px currentColor;
	}
	.chip-score.green {
		background: var(--green-bg);
		color: var(--green);
	}
	.chip-score.yellow {
		background: var(--yellow-bg);
		color: var(--yellow);
	}
	.chip-score.red {
		background: var(--red-bg);
		color: var(--red);
	}
</style>
