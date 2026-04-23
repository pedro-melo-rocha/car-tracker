<script lang="ts">
	import type { Car } from '$lib/types';
	import { cars } from '$lib/stores/cars';
	import { computeScoreBreakdown, locationKm } from '$lib/scoring';
	import {
		SCORE_WEIGHTS,
		DATALIST_MAKES,
		DATALIST_ENGINES,
		EXTRA_MAKES,
		getModelEngineHints
	} from '$lib/constants';
	import ScoreBadge from '$components/ui/ScoreBadge.svelte';
	import CustomSelect from '$components/ui/CustomSelect.svelte';
	import CustomCombobox from '$components/ui/CustomCombobox.svelte';

	type Draft = {
		title: string;
		make: string;
		model: string;
		year: number | null;
		km: number | null;
		price: number | null;
		fuel: '' | 'Diesel' | 'Gasolina';
		engine: string;
		power: number | null;
		location: string;
		notes: string;
	};

	const blank: Draft = {
		title: '',
		make: '',
		model: '',
		year: null,
		km: null,
		price: null,
		fuel: '',
		engine: '',
		power: null,
		location: '',
		notes: ''
	};

	function draftFromCar(c: Car): Draft {
		return {
			title: c.title ?? '',
			make: c.make ?? '',
			model: c.model ?? '',
			year: c.year ?? null,
			km: c.km ?? null,
			price: c.price ?? null,
			fuel: (c.fuel as Draft['fuel']) ?? '',
			engine: c.engine ?? '',
			power: c.power ?? null,
			location: c.location ?? '',
			notes: c.notes ?? ''
		};
	}

	let sourceId = $state<string>('');
	let draft = $state<Draft>({ ...blank });

	function loadFrom(id: string) {
		sourceId = id;
		if (!id) {
			draft = { ...blank };
			return;
		}
		const c = $cars.find((x) => x.id === id);
		if (c) draft = draftFromCar(c);
	}

	function resetToSource() {
		loadFrom(sourceId);
	}

	const breakdown = $derived(computeScoreBreakdown(draft));
	const distance = $derived(locationKm(draft.location));

	const rankedEngineOptions = $derived.by(() => {
		const hints = getModelEngineHints(draft.make, draft.model);
		if (hints.length === 0) return DATALIST_ENGINES;
		const hintSet = new Set(hints);
		const rest = DATALIST_ENGINES.filter((e) => !hintSet.has(e));
		return [...hints, ...rest];
	});

	const hasMinForScore = $derived(
		draft.km != null ||
			draft.price != null ||
			!!draft.location ||
			draft.year != null ||
			!!draft.make
	);
	const metaLine = $derived(
		[draft.make, draft.model, draft.year != null ? String(draft.year) : '']
			.filter(Boolean)
			.join(' · ')
	);
	const displayTitle = $derived(draft.title || 'Untitled draft');
	const now = new Date();
	const stampDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

	function fmtNum(n: number | null) {
		return n == null ? '—' : n.toLocaleString('en-US').replace(/,/g, ' ');
	}

	const carOptions = $derived([
		{ value: '', label: '— Blank (test from scratch) —' },
		...$cars
			.map((c) => ({ value: c.id, label: c.title }))
			.sort((a, b) => a.label.localeCompare(b.label))
	]);
	const fuelOptions = [
		{ value: '', label: '—' },
		{ value: 'Diesel', label: 'Diesel' },
		{ value: 'Gasolina', label: 'Gasolina' }
	];
	const allMakes = [...DATALIST_MAKES, ...EXTRA_MAKES].sort();

	function barCls(v: number) {
		return v >= 70 ? 'good' : v >= 50 ? 'warn' : 'bad';
	}
</script>

<div class="lab">
	<div class="intro">
		<h1>Score Lab</h1>
		<p class="lede">
			Try out the scoring formula without touching real data. Load an existing car or build one
			from scratch, then tweak any field to see how the score reacts.
		</p>
	</div>

	<div class="loader">
		<label class="loader-label" for="lab-source">Source</label>
		<div class="loader-row">
			<div class="loader-select">
				<CustomSelect
					options={carOptions}
					value={sourceId}
					ariaLabel="Load from existing car"
					filterable
					filterPlaceholder="Search cars…"
					onchange={(v) => loadFrom(v)}
				/>
			</div>
			<button type="button" class="btn secondary" onclick={resetToSource}>
				{sourceId ? 'Reset to source' : 'Clear form'}
			</button>
		</div>
	</div>

	<div class="grid">
		<form class="form" onsubmit={(e) => e.preventDefault()}>
			<div class="form-row">
				<div class="form-group">
					<label for="lab-make">Make</label>
					<CustomCombobox
						id="lab-make"
						options={allMakes}
						placeholder="e.g. Renault"
						bind:value={draft.make}
					/>
				</div>
				<div class="form-group">
					<label for="lab-model">Model</label>
					<input
						id="lab-model"
						type="text"
						placeholder="e.g. Clio"
						bind:value={draft.model}
						autocomplete="off"
					/>
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="lab-year">Year</label>
					<input
						id="lab-year"
						type="number"
						placeholder="2008"
						min="1950"
						max="2100"
						step="1"
						bind:value={draft.year}
					/>
				</div>
				<div class="form-group">
					<label for="lab-km">Km</label>
					<input
						id="lab-km"
						type="number"
						placeholder="120000"
						min="0"
						step="1"
						bind:value={draft.km}
					/>
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="lab-price">Price (EUR)</label>
					<input
						id="lab-price"
						type="number"
						placeholder="5500"
						min="0"
						step="1"
						bind:value={draft.price}
					/>
				</div>
				<div class="form-group">
					<label for="lab-fuel">Fuel</label>
					<CustomSelect options={fuelOptions} placeholder="—" bind:value={draft.fuel} />
				</div>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="lab-engine">Engine</label>
					<CustomCombobox
						id="lab-engine"
						options={rankedEngineOptions}
						placeholder="e.g. 1.5 dCi, 1.4 D-4D"
						bind:value={draft.engine}
					/>
				</div>
				<div class="form-group">
					<label for="lab-power">Power (cv)</label>
					<input
						id="lab-power"
						type="number"
						placeholder="90"
						min="0"
						step="1"
						bind:value={draft.power}
					/>
				</div>
			</div>

			<div class="form-group">
				<label for="lab-location">Location</label>
				<input
					id="lab-location"
					type="text"
					placeholder="e.g. Lisboa, Porto"
					bind:value={draft.location}
				/>
				{#if distance != null}
					<div class="field-hint">{distance} km from Viana do Castelo</div>
				{/if}
			</div>

			<div class="form-group">
				<label for="lab-notes">Notes</label>
				<textarea
					id="lab-notes"
					placeholder="Free text — affects engine-profile detection"
					bind:value={draft.notes}
				></textarea>
			</div>
		</form>

		<aside class="panel" class:empty={!hasMinForScore}>
			<header class="card-head">
				<div class="card-head-text">
					<div class="eyebrow">Score card</div>
					{#if hasMinForScore}
						<h2 class="card-meta">{metaLine || 'Untitled draft'}</h2>
					{:else}
						<h2 class="card-meta muted">Fill the form to score a car</h2>
					{/if}
				</div>
				<div class="card-head-score">
					{#if hasMinForScore}
						<ScoreBadge score={breakdown.total} size="lg" />
					{:else}
						<span class="score-empty" aria-label="No score yet">—</span>
					{/if}
					<span class="score-div">/100</span>
				</div>
			</header>

			<div class="specs">
				<div class="spec">
					<span class="spec-label">Km</span>
					<span class="spec-value" class:muted={draft.km == null}>{fmtNum(draft.km)}</span>
				</div>
				<div class="spec">
					<span class="spec-label">Price</span>
					<span class="spec-value" class:muted={draft.price == null}
						>{draft.price == null ? '—' : `€${fmtNum(draft.price)}`}</span
					>
				</div>
				<div class="spec">
					<span class="spec-label">Year</span>
					<span class="spec-value" class:muted={draft.year == null}>{draft.year ?? '—'}</span>
				</div>
				<div class="spec">
					<span class="spec-label">Fuel</span>
					<span class="spec-value" class:muted={!draft.fuel}>{draft.fuel || '—'}</span>
				</div>
				<div class="spec">
					<span class="spec-label">Engine</span>
					<span class="spec-value" class:muted={!draft.engine}>{draft.engine || '—'}</span>
				</div>
				<div class="spec">
					<span class="spec-label">Power</span>
					<span class="spec-value" class:muted={draft.power == null}
						>{draft.power == null ? '—' : `${draft.power} cv`}</span
					>
				</div>
				<div class="spec spec-wide">
					<span class="spec-label">Location</span>
					<span class="spec-value" class:muted={!draft.location}>{draft.location || '—'}</span>
					{#if distance != null}
						<span class="spec-sub">{distance} km from Viana</span>
					{/if}
				</div>
				{#if draft.notes}
					<div class="spec spec-wide spec-multi">
						<span class="spec-label">Notes</span>
						<span class="spec-value">{draft.notes}</span>
					</div>
				{/if}
			</div>

			<div class="breakdown">
				<div class="br-row">
					<span class="br-label">Kms</span>
					<span class="br-weight">{Math.round(SCORE_WEIGHTS.km * 100)}%</span>
					<span class="br-value"
						>{hasMinForScore ? breakdown.km : '—'}<span class="br-div">/100</span></span
					>
					<span class="br-bar"
						><span
							class="br-fill {barCls(breakdown.km)}"
							style="width:{hasMinForScore ? breakdown.km : 0}%"
						></span></span
					>
				</div>
				<div class="br-row">
					<span class="br-label">Price</span>
					<span class="br-weight">{Math.round(SCORE_WEIGHTS.price * 100)}%</span>
					<span class="br-value"
						>{hasMinForScore ? breakdown.price : '—'}<span class="br-div">/100</span></span
					>
					<span class="br-bar"
						><span
							class="br-fill {barCls(breakdown.price)}"
							style="width:{hasMinForScore ? breakdown.price : 0}%"
						></span></span
					>
				</div>
				<div class="br-row">
					<span class="br-label">Reliability</span>
					<span class="br-weight">{Math.round(SCORE_WEIGHTS.reliability * 100)}%</span>
					<span class="br-value"
						>{hasMinForScore ? breakdown.rel.score : '—'}<span class="br-div">/100</span></span
					>
					<span class="br-bar"
						><span
							class="br-fill {barCls(breakdown.rel.score)}"
							style="width:{hasMinForScore ? breakdown.rel.score : 0}%"
						></span></span
					>
				</div>
				{#if hasMinForScore}
					{#if breakdown.rel.matched && breakdown.rel.reason}
						<div
							class="br-reason"
							class:pos={breakdown.rel.delta > 0}
							class:neg={breakdown.rel.delta < 0}
						>
							{breakdown.rel.delta > 0 ? '+' : ''}{breakdown.rel.delta} · {breakdown.rel.reason}
						</div>
					{:else}
						<div class="br-reason warn">
							Engine not recognised — using {draft.make || 'default'} baseline ({breakdown.rel.base}/100).
						</div>
					{/if}
				{/if}
				<div class="br-row">
					<span class="br-label">Year</span>
					<span class="br-weight">{Math.round(SCORE_WEIGHTS.year * 100)}%</span>
					<span class="br-value"
						>{hasMinForScore ? breakdown.year : '—'}<span class="br-div">/100</span></span
					>
					<span class="br-bar"
						><span
							class="br-fill {barCls(breakdown.year)}"
							style="width:{hasMinForScore ? breakdown.year : 0}%"
						></span></span
					>
				</div>
				<div class="br-row">
					<span class="br-label">Location</span>
					<span class="br-weight">{Math.round(SCORE_WEIGHTS.location * 100)}%</span>
					<span class="br-value"
						>{hasMinForScore ? breakdown.loc : '—'}<span class="br-div">/100</span></span
					>
					<span class="br-bar"
						><span
							class="br-fill {barCls(breakdown.loc)}"
							style="width:{hasMinForScore ? breakdown.loc : 0}%"
						></span></span
					>
				</div>
			</div>

			<footer class="card-foot">
				<span class="stamp">Score Lab · car-tracker</span>
				<span class="stamp-date">{stampDate}</span>
			</footer>
		</aside>
	</div>
</div>

<style>
	.lab {
		padding: 8px 0 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	.intro h1 {
		font-size: 1.625rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.2;
		color: var(--ink);
		margin: 0 0 0.5rem 0;
	}
	.lede {
		font-size: 0.88rem;
		color: var(--ink-soft);
		margin: 0;
		max-width: 620px;
		line-height: 1.5;
	}
	.loader {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.loader-label {
		font-size: 0.7rem;
		color: var(--ink-dim);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
	}
	.loader-row {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.loader-select {
		flex: 1;
		min-width: 0;
		max-width: 420px;
	}
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
		gap: 20px;
		align-items: stretch;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: var(--radius-lg);
		padding: 20px;
	}
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	label {
		font-size: 0.7rem;
		color: var(--ink-dim);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
	}
	input,
	textarea {
		padding: 10px 14px;
		border: 1px solid var(--rule);
		border-radius: 10px;
		font-size: 0.85rem;
		background: var(--card-2);
		color: var(--ink);
		font-family: inherit;
		transition:
			border-color var(--dur-fast) var(--ease),
			background var(--dur-fast) var(--ease);
	}
	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--accent);
		background: var(--card);
	}
	textarea {
		min-height: 72px;
		resize: vertical;
	}
	.field-hint {
		font-size: 0.72rem;
		color: var(--ink-dim);
		padding: 0 2px;
	}
	.panel {
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: var(--radius-lg);
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		position: sticky;
		top: 80px;
	}
	.card-head {
		display: flex;
		gap: 14px;
		align-items: flex-start;
		justify-content: space-between;
	}
	.card-head-text {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
		flex: 1;
	}
	.eyebrow {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	.card-meta {
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		line-height: 1.25;
		color: var(--ink);
		margin: 0;
		word-break: break-word;
	}
	.card-meta.muted {
		color: var(--ink-dim);
		font-weight: 500;
	}
	.card-head-score {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}
	.score-empty {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--card-2);
		color: var(--ink-dim);
		font-size: 1.4rem;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px dashed var(--rule);
	}
	.score-div {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--ink-dim);
		font-variant-numeric: tabular-nums;
	}
	.specs {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}
	.spec {
		background: var(--card-2);
		border-radius: 8px;
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}
	.spec-wide {
		grid-column: 1 / -1;
	}
	.spec-multi .spec-value {
		white-space: pre-wrap;
		overflow: visible;
		font-weight: 500;
		font-size: 0.82rem;
		line-height: 1.45;
		color: var(--ink-soft);
	}
	.spec-label {
		font-size: 0.66rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	.spec-value {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--ink);
		font-variant-numeric: tabular-nums;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.spec-value.muted {
		color: var(--ink-dim);
		font-weight: 500;
	}
	.spec-sub {
		font-size: 0.7rem;
		color: var(--ink-dim);
		margin-top: 1px;
	}
	.card-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 10px;
		border-top: 1px solid var(--rule);
	}
	.stamp,
	.stamp-date {
		font-size: 0.66rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-dim);
		font-variant-numeric: tabular-nums;
	}
	.panel.empty .br-row {
		opacity: 0.55;
	}
	.breakdown {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.br-row {
		display: grid;
		grid-template-columns: 1fr auto auto;
		column-gap: 10px;
		row-gap: 4px;
		align-items: center;
	}
	.br-label {
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--ink);
	}
	.br-weight {
		font-size: 0.7rem;
		color: var(--ink-dim);
		font-variant-numeric: tabular-nums;
	}
	.br-value {
		font-family: var(--mono);
		font-weight: 600;
		font-size: 0.82rem;
		text-align: right;
		color: var(--ink);
	}
	.br-div {
		color: var(--ink-dim);
		font-weight: 400;
	}
	.br-bar {
		grid-column: 1 / -1;
		height: 4px;
		background: var(--card-2);
		border-radius: 2px;
		position: relative;
		overflow: hidden;
	}
	.br-fill {
		position: absolute;
		inset: 0 auto 0 0;
		border-radius: 2px;
		transition: width var(--dur) var(--ease);
	}
	.br-fill.good {
		background: var(--good);
	}
	.br-fill.warn {
		background: var(--warn);
	}
	.br-fill.bad {
		background: var(--bad);
	}
	.br-reason {
		grid-column: 1 / -1;
		font-size: 0.72rem;
		padding: 6px 10px;
		border-radius: 8px;
		background: var(--card-2);
		color: var(--ink-soft);
	}
	.br-reason.pos {
		background: var(--good-bg);
		color: var(--good);
	}
	.br-reason.neg {
		background: var(--bad-bg);
		color: var(--bad);
	}
	.br-reason.warn {
		background: var(--warn-bg);
		color: var(--warn);
	}
	.btn {
		padding: 10px 16px;
		border: 0;
		border-radius: 10px;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--dur-fast) var(--ease);
		white-space: nowrap;
	}
	.btn.secondary {
		background: transparent;
		color: var(--ink-soft);
		border: 1px solid var(--rule);
	}
	.btn.secondary:hover {
		background: var(--card-2);
		color: var(--ink);
	}
	@media (max-width: 900px) {
		.grid {
			grid-template-columns: 1fr;
		}
		.panel {
			position: static;
			order: -1;
		}
	}
	@media (max-width: 640px) {
		.form-row {
			grid-template-columns: 1fr;
		}
		.specs {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
