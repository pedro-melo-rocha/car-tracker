<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { cars } from '$lib/stores/cars';
	import { compareIds, toggleCompare, clearCompare } from '$lib/stores/compare';
	import { computeScore, computeScoreBreakdown, locationKm } from '$lib/scoring';
	import ScoreBadge from '$components/ui/ScoreBadge.svelte';
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

	function scoreOf(c: Car) {
		return computeScore(c);
	}
	function relOf(c: Car) {
		return computeScoreBreakdown(c).rel.score;
	}
	function distOf(c: Car) {
		return locationKm(c.location);
	}

	type Row = {
		key: string;
		label: string;
		get: (c: Car) => string;
		winner?: (cars: Car[]) => string | null;
		big?: boolean;
	};

	function uniqueBest<T>(
		list: T[],
		idOf: (t: T) => string,
		valueOf: (t: T) => number | null | undefined,
		direction: 'min' | 'max'
	): string | null {
		const vals = list
			.map((t) => ({ id: idOf(t), v: valueOf(t) }))
			.filter((x): x is { id: string; v: number } => x.v != null);
		if (!vals.length) return null;
		const best = vals.reduce((a, b) =>
			direction === 'min' ? (a.v < b.v ? a : b) : (a.v > b.v ? a : b)
		);
		const tied = vals.filter((x) => x.v === best.v);
		return tied.length === 1 ? best.id : null;
	}

	const rows: Row[] = [
		{
			key: 'price',
			label: 'Price',
			big: true,
			get: (c) => (c.price ? '€' + c.price.toLocaleString('pt-PT') : '—'),
			winner: (list) => uniqueBest(list, (c) => c.id, (c) => c.price, 'min')
		},
		{
			key: 'km',
			label: 'Kilometres',
			get: (c) => (c.km ? c.km.toLocaleString('pt-PT') + ' km' : '—'),
			winner: (list) => uniqueBest(list, (c) => c.id, (c) => c.km, 'min')
		},
		{
			key: 'year',
			label: 'Year',
			get: (c) => (c.year ? String(c.year) : '—'),
			winner: (list) => uniqueBest(list, (c) => c.id, (c) => c.year, 'max')
		},
		{ key: 'fuel', label: 'Fuel', get: (c) => c.fuel ?? '—' },
		{ key: 'engine', label: 'Engine', get: (c) => c.engine ?? '—' },
		{ key: 'power', label: 'Power', get: (c) => (c.power ? c.power + ' cv' : '—') },
		{ key: 'location', label: 'Location', get: (c) => c.location ?? '—' },
		{
			key: 'distance',
			label: 'Distance',
			get: (c) => {
				const d = distOf(c);
				return d != null ? d + ' km' : '—';
			},
			winner: (list) => uniqueBest(list, (c) => c.id, (c) => distOf(c), 'min')
		},
		{
			key: 'reliability',
			label: 'Reliability',
			get: (c) => relOf(c) + '/100',
			winner: (list) => uniqueBest(list, (c) => c.id, (c) => relOf(c), 'max')
		},
		{ key: 'notes', label: 'Notes', get: (c) => c.notes ?? '—' }
	];

	const topPickId = $derived.by(() => {
		if (selected.length < 2) return null;
		const tops = [...selected].sort((a, b) => scoreOf(b) - scoreOf(a));
		const topScore = scoreOf(tops[0]);
		const tied = tops.filter((c) => scoreOf(c) === topScore);
		if (tied.length === 1) return tied[0].id;
		const sorted = [...tied].sort((a, b) => {
			const pa = a.price ?? Infinity;
			const pb = b.price ?? Infinity;
			if (pa !== pb) return pa - pb;
			return (a.km ?? Infinity) - (b.km ?? Infinity);
		});
		return sorted[0].id;
	});

	const bestByRow = $derived.by(() => {
		const out: Record<string, string | null> = {};
		for (const r of rows) {
			out[r.key] = r.winner ? r.winner(selected) : null;
		}
		return out;
	});

	function openDetail(id: string) {
		const url = new URL(page.url);
		url.searchParams.set('car', id);
		goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
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
		<div class="selectors-label">Tap to add up to 5</div>
		{#if visible.length === 0}
			<div class="empty-inline">No cars match your filter.</div>
		{:else}
			<div class="pills">
				{#each visible as { car } (car.id)}
					{@const isSelected = $compareIds.includes(car.id)}
					{@const disabled = !isSelected && atLimit}
					<button
						type="button"
						class="pill"
						class:active={isSelected}
						class:disabled
						title={disabled ? 'Max 5 cars to compare' : ''}
						onclick={() => toggleCompare(car.id)}
					>
						{car.title}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if selected.length === 0}
		<div class="empty">Choose cars to compare.</div>
	{:else if selected.length < 2}
		<div class="empty">
			Pick {2 - selected.length} more car to start comparing.
		</div>
	{:else}
		<div class="cards" style="grid-template-columns: repeat({selected.length}, 1fr)">
			{#each selected as c (c.id)}
				<article class="card" class:is-top-pick={topPickId === c.id}>
					<header class="card-head">
						<div class="head-row">
							<ScoreBadge score={scoreOf(c)} size="lg" />
							<div class="head-text">
								<div class="head-meta">
									<span>{c.source ?? '—'}</span>
									{#if topPickId === c.id}
										<span class="pick-tag" aria-label="Top pick overall">
											<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
												<polygon points="12 2 15 9 22 10 17 15 18 22 12 19 6 22 7 15 2 10 9 9" />
											</svg>
											Top pick
										</span>
									{/if}
								</div>
								<button type="button" class="head-title" onclick={() => openDetail(c.id)}>
									{c.title}
								</button>
							</div>
							<button
								type="button"
								class="remove"
								aria-label="Remove from compare"
								onclick={() => toggleCompare(c.id)}
							>
								×
							</button>
						</div>
					</header>
					<div class="rows">
						{#each rows as r (r.key)}
							{@const isWinner = bestByRow[r.key] === c.id}
							<div class="row" class:winner={isWinner}>
								<span class="row-label">{r.label}</span>
								<span class="row-value" class:big={r.big}>
									{r.get(c)}
									{#if isWinner}<span class="star">★</span>{/if}
								</span>
							</div>
						{/each}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.compare-view {
		padding: 8px 0 24px;
	}
	.filter-bar {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
		padding: 8px 0 14px;
	}
	.search {
		flex: 1;
		min-width: 240px;
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
	.selectors {
		margin-bottom: 24px;
	}
	.selectors-label {
		font-size: 0.72rem;
		color: var(--ink-dim);
		margin-bottom: 8px;
	}
	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.pill {
		padding: 6px 12px;
		border-radius: 999px;
		background: var(--card);
		color: var(--ink);
		border: 1px solid var(--rule);
		font-size: 0.76rem;
		font-family: inherit;
		cursor: pointer;
		transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
	}
	.pill:hover {
		background: var(--card-2);
	}
	.pill.active {
		background: var(--accent);
		color: #fff;
		border-color: var(--accent);
	}
	.pill.disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.empty-inline {
		color: var(--ink-dim);
		font-size: 0.82rem;
		padding: 8px;
	}
	.empty {
		text-align: center;
		padding: 60px 16px;
		color: var(--ink-dim);
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: var(--radius-xl);
	}
	.cards {
		display: grid;
		gap: 16px;
	}
	.card {
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: var(--radius-xl);
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.card.is-top-pick {
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--accent-light);
	}
	.card-head {
		padding: 20px;
		border-bottom: 1px solid var(--rule);
	}
	.head-row {
		display: flex;
		gap: 14px;
		align-items: flex-start;
	}
	.head-text {
		flex: 1;
		min-width: 0;
	}
	.head-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		font-size: 0.68rem;
		color: var(--ink-dim);
	}
	.pick-tag {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		padding: 2px 7px;
		border-radius: 999px;
		background: var(--good-bg);
		color: var(--good);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}
	.head-title {
		background: transparent;
		border: 0;
		text-align: left;
		padding: 0;
		margin-top: 2px;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.015em;
		color: var(--ink);
		cursor: pointer;
	}
	.head-title:hover {
		color: var(--accent);
	}
	.remove {
		background: transparent;
		border: 0;
		font-size: 1.2rem;
		line-height: 1;
		color: var(--ink-dim);
		cursor: pointer;
		padding: 2px 6px;
	}
	.remove:hover {
		color: var(--ink);
	}
	.rows {
		display: flex;
		flex-direction: column;
	}
	.row {
		padding: 10px 20px;
		border-bottom: 1px solid var(--rule);
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 10px;
	}
	.row:last-child {
		border-bottom: 0;
	}
	.row.winner {
		background: var(--good-bg);
	}
	.row-label {
		font-size: 0.72rem;
		color: var(--ink-soft);
	}
	.row.winner .row-label {
		color: var(--good);
		font-weight: 600;
	}
	.row-value {
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--ink);
		letter-spacing: -0.01em;
		text-align: right;
		max-width: 60%;
		white-space: pre-wrap;
	}
	.row-value.big {
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	.row.winner .row-value {
		color: var(--good);
		font-weight: 600;
	}
	.star {
		margin-left: 6px;
		font-size: 0.7rem;
	}
	@media (max-width: 900px) {
		.cards {
			grid-template-columns: 1fr !important;
		}
	}
</style>
