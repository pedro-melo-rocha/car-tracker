<script lang="ts">
	import type { Car } from '$lib/types';
	import { cars } from '$lib/stores/cars';
	import { computeScoreBreakdown, getEngineProfile, locationKm } from '$lib/scoring';
	import { SCORE_WEIGHTS, DATALIST_MAKES, DATALIST_ENGINES, EXTRA_MAKES } from '$lib/constants';
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

	const sourceCar = $derived(sourceId ? $cars.find((c) => c.id === sourceId) ?? null : null);
	const sourceBreakdown = $derived(sourceCar ? computeScoreBreakdown(sourceCar) : null);
	const breakdown = $derived(computeScoreBreakdown(draft));
	const scoreDelta = $derived(
		sourceBreakdown ? breakdown.total - sourceBreakdown.total : null
	);
	const distance = $derived(locationKm(draft.location));
	const engineProfile = $derived(
		getEngineProfile({ title: draft.title, notes: draft.notes, engine: draft.engine })
	);

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
			<div class="form-group">
				<label for="lab-title">Title</label>
				<input
					id="lab-title"
					type="text"
					placeholder="e.g. Renault Clio III 1.5 dCi 2008"
					bind:value={draft.title}
				/>
			</div>

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
						options={DATALIST_ENGINES}
						placeholder="e.g. 1.5 dCi, 1.4 D-4D"
						bind:value={draft.engine}
					/>
					{#if engineProfile}
						<div
							class="engine-hint"
							class:pos={engineProfile.delta > 0}
							class:neg={engineProfile.delta < 0}
						>
							{engineProfile.delta > 0 ? '+' : ''}{engineProfile.delta} · {engineProfile.reason}
						</div>
					{/if}
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

		<aside class="panel">
			<div class="score-head">
				<ScoreBadge score={breakdown.total} size="lg" />
				<div class="score-head-text">
					<div class="score-total">{breakdown.total}<span class="score-div">/100</span></div>
					{#if sourceBreakdown && scoreDelta != null}
						<div class="score-delta" class:pos={scoreDelta > 0} class:neg={scoreDelta < 0}>
							source {sourceBreakdown.total}
							<span class="arrow">→</span>
							{breakdown.total}
							<span class="delta-num">
								({scoreDelta > 0 ? '+' : ''}{scoreDelta})
							</span>
						</div>
					{:else}
						<div class="score-sub">Live score</div>
					{/if}
				</div>
			</div>

			<div class="breakdown">
				<div class="br-row">
					<span class="br-label">Kms</span>
					<span class="br-weight">{Math.round(SCORE_WEIGHTS.km * 100)}%</span>
					<span class="br-value">{breakdown.km}<span class="br-div">/100</span></span>
					<span class="br-bar"
						><span class="br-fill {barCls(breakdown.km)}" style="width:{breakdown.km}%"></span></span
					>
				</div>
				<div class="br-row">
					<span class="br-label">Price</span>
					<span class="br-weight">{Math.round(SCORE_WEIGHTS.price * 100)}%</span>
					<span class="br-value">{breakdown.price}<span class="br-div">/100</span></span>
					<span class="br-bar"
						><span
							class="br-fill {barCls(breakdown.price)}"
							style="width:{breakdown.price}%"
						></span></span
					>
				</div>
				<div class="br-row">
					<span class="br-label">Reliability</span>
					<span class="br-weight">{Math.round(SCORE_WEIGHTS.reliability * 100)}%</span>
					<span class="br-value">{breakdown.rel.score}<span class="br-div">/100</span></span>
					<span class="br-bar"
						><span
							class="br-fill {barCls(breakdown.rel.score)}"
							style="width:{breakdown.rel.score}%"
						></span></span
					>
				</div>
				{#if breakdown.rel.reason}
					<div
						class="br-reason"
						class:pos={breakdown.rel.delta > 0}
						class:neg={breakdown.rel.delta < 0}
					>
						{breakdown.rel.delta > 0 ? '+' : ''}{breakdown.rel.delta} · {breakdown.rel.reason}
					</div>
				{/if}
				<div class="br-row">
					<span class="br-label">Year</span>
					<span class="br-weight">{Math.round(SCORE_WEIGHTS.year * 100)}%</span>
					<span class="br-value">{breakdown.year}<span class="br-div">/100</span></span>
					<span class="br-bar"
						><span
							class="br-fill {barCls(breakdown.year)}"
							style="width:{breakdown.year}%"
						></span></span
					>
				</div>
				<div class="br-row">
					<span class="br-label">Location</span>
					<span class="br-weight">{Math.round(SCORE_WEIGHTS.location * 100)}%</span>
					<span class="br-value">{breakdown.loc}<span class="br-div">/100</span></span>
					<span class="br-bar"
						><span class="br-fill {barCls(breakdown.loc)}" style="width:{breakdown.loc}%"></span></span
					>
				</div>
			</div>
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
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--ink);
		margin: 0 0 4px 0;
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
		align-items: start;
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
	.engine-hint {
		font-size: 0.72rem;
		padding: 6px 10px;
		border-radius: 8px;
		background: var(--card-2);
		color: var(--ink-soft);
	}
	.engine-hint.pos {
		background: var(--good-bg);
		color: var(--good);
	}
	.engine-hint.neg {
		background: var(--bad-bg);
		color: var(--bad);
	}
	.panel {
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: var(--radius-lg);
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 18px;
		position: sticky;
		top: 80px;
	}
	.score-head {
		display: flex;
		gap: 14px;
		align-items: center;
	}
	.score-head-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.score-total {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--ink);
		line-height: 1;
	}
	.score-div {
		font-size: 0.9rem;
		font-weight: 400;
		color: var(--ink-dim);
	}
	.score-sub {
		font-size: 0.7rem;
		color: var(--ink-dim);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
	}
	.score-delta {
		font-size: 0.78rem;
		color: var(--ink-soft);
		font-variant-numeric: tabular-nums;
	}
	.score-delta .arrow {
		color: var(--ink-dim);
		margin: 0 2px;
	}
	.score-delta .delta-num {
		margin-left: 4px;
		font-weight: 600;
		color: var(--ink-dim);
	}
	.score-delta.pos .delta-num {
		color: var(--good);
	}
	.score-delta.neg .delta-num {
		color: var(--bad);
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
	}
</style>
