<script lang="ts">
	import type { Car } from '$lib/types';
	import { STATUSES, STATUS_LABELS, type CarStatus } from '$lib/types';
	import { computeScore, computeScoreBreakdown, detectScamRisk, locationKm } from '$lib/scoring';
	import { netPriceDrop } from '$lib/price';
	import { SCORE_WEIGHTS } from '$lib/constants';
	import PriceHistoryTimeline from './PriceHistoryTimeline.svelte';
	import { cars, deleteCar as removeCar, updateCar } from '$lib/stores/cars';
	import { confirmDialog, toast } from '$lib/stores/ui';

	let {
		car,
		onclose,
		onedit
	}: {
		car: Car;
		onclose: () => void;
		onedit: (id: string) => void;
	} = $props();

	const score = $derived(computeScore(car));
	const breakdown = $derived(computeScoreBreakdown(car));
	const scam = $derived(detectScamRisk(car, { peers: $cars }));
	const engineLine = $derived(
		[car.engine, car.power ? car.power + 'cv' : ''].filter(Boolean).join(' · ')
	);
	const distance = $derived(locationKm(car.location));
	const priceDrop = $derived(netPriceDrop(car.priceHistory));

	const scoreTone = $derived(score >= 70 ? 'good' : score >= 50 ? 'warn' : 'bad');
	const scoreColor = $derived(
		scoreTone === 'good'
			? 'var(--good)'
			: scoreTone === 'warn'
				? 'var(--warn)'
				: 'var(--bad)'
	);
	const scoreBgColor = $derived(
		scoreTone === 'good'
			? 'var(--good-bg)'
			: scoreTone === 'warn'
				? 'var(--warn-bg)'
				: 'var(--bad-bg)'
	);

	function barCls(v: number) {
		return v >= 70 ? 'good' : v >= 50 ? 'warn' : 'bad';
	}

	async function onShare() {
		const url = `${location.origin}/share/${car.id}`;
		try {
			await navigator.clipboard.writeText(url);
			toast.success('Share link copied');
		} catch {
			toast.info(url);
		}
	}

	async function onDelete() {
		const ok = await confirmDialog({
			title: 'Delete car',
			message: `Remove "${car.title}" permanently?`,
			confirmLabel: 'Delete'
		});
		if (!ok) return;
		await removeCar(car.id);
		onclose();
	}

	let pendingStatus: CarStatus | null = $state(null);
	let reasonOpen = $state(false);

	async function setStatus(next: CarStatus) {
		if (car.status === next || pendingStatus !== null) return;
		pendingStatus = next;
		try {
			await updateCar(car.id, { status: next });
			toast.success(`Moved to ${STATUS_LABELS[next]}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to update');
		} finally {
			pendingStatus = null;
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
			return;
		}
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		const t = e.target;
		if (
			t instanceof HTMLElement &&
			(t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
		) {
			return;
		}
		const idx = Number(e.key) - 1;
		if (Number.isInteger(idx) && idx >= 0 && idx < STATUSES.length) {
			e.preventDefault();
			void setStatus(STATUSES[idx]);
		}
	}

	$effect(() => {
		document.addEventListener('keydown', onKeydown);
		return () => document.removeEventListener('keydown', onKeydown);
	});
</script>

<div class="detail-overlay" onclick={onclose} role="presentation"></div>
<div class="detail-panel" role="dialog" aria-modal="true" aria-label="Car details" tabindex="-1">
	<div class="content">
		<div class="head">
			<div class="eyebrow">
				{#if car.source}{car.source}{/if}
				<span class="dot-sep">·</span>
				<span class="id">{car.id.slice(0, 8)}</span>
			</div>
			<button type="button" class="close-btn" onclick={onclose} aria-label="Close">
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
					<path d="M4 4l8 8M12 4l-8 8" />
				</svg>
			</button>
		</div>

		<h1 class="title">{car.title}</h1>

		{#if car.imageUrl}
			<img
				class="hero-img"
				src={car.imageUrl}
				alt=""
				loading="lazy"
				onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
			/>
		{/if}

		<div class="score-widget" style="background: {scoreBgColor}; color: {scoreColor};">
			<div class="score-num">{score}</div>
			<div class="score-label">SCORE</div>
		</div>

		<div class="price-line">{car.price ? '€' + car.price.toLocaleString('pt-PT') : '—'}</div>
		<div class="facts-line">
			{car.km ? car.km.toLocaleString('pt-PT') + ' km' : '—'}
			<span class="dot-sep">·</span>
			{car.year ?? '—'}
			<span class="dot-sep">·</span>
			{car.fuel ?? '—'}
		</div>
		{#if priceDrop > 0}
			<div class="drop-badge">↓ dropped €{priceDrop.toLocaleString('pt-PT')} total</div>
		{/if}

		{#if car.url}
			<a href={car.url} target="_blank" rel="noopener noreferrer" class="link-btn">
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 3H3v10h10v-3M9 1h6v6M7 9L15 1" />
				</svg>
				Open Listing
			</a>
		{/if}

		<section class="section">
			<h3>Status</h3>
			<div class="status-switcher">
				{#each STATUSES as s (s)}
					<button
						type="button"
						class="status-chip"
						class:active={car.status === s}
						class:pending={pendingStatus === s}
						onclick={() => setStatus(s)}
					>
						{STATUS_LABELS[s]}
					</button>
				{/each}
			</div>
		</section>

		<section class="section">
			<h3>Score breakdown</h3>
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
					<span class="br-label">
						Reliability
						<button
							type="button"
							class="reason-tip"
							class:warn={!breakdown.rel.matched}
							aria-expanded={reasonOpen}
							aria-controls="reliability-reason"
							aria-label={breakdown.rel.matched
								? reasonOpen
									? 'Hide reliability explanation'
									: 'Show reliability explanation'
								: 'Engine not recognised — show explanation'}
							title={breakdown.rel.matched
								? reasonOpen
									? 'Hide explanation'
									: 'Why this score?'
								: 'Engine not recognised — tap for details'}
							onclick={() => (reasonOpen = !reasonOpen)}
						>
							?
						</button>
					</span>
					<span class="br-weight">{Math.round(SCORE_WEIGHTS.reliability * 100)}%</span>
					<span class="br-value">{breakdown.rel.score}<span class="br-div">/100</span></span>
					<span class="br-bar"
						><span
							class="br-fill {barCls(breakdown.rel.score)}"
							style="width:{breakdown.rel.score}%"
						></span></span
					>
				</div>
				{#if reasonOpen}
					<div
						id="reliability-reason"
						class="br-reason"
						class:pos={breakdown.rel.matched && breakdown.rel.delta > 0}
						class:neg={breakdown.rel.matched && breakdown.rel.delta < 0}
					>
						{#if breakdown.rel.matched && breakdown.rel.reason}
							{breakdown.rel.delta > 0 ? '+' : ''}{breakdown.rel.delta} · {breakdown.rel.reason}
						{:else}
							No engine profile matched — score uses the make reliability baseline only ({breakdown.rel.base}/100). Add or refine the engine field to get a more specific score.
						{/if}
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
						><span class="br-fill {barCls(breakdown.loc)}" style="width:{breakdown.loc}%"
						></span></span
					>
				</div>
			</div>
		</section>

		<section class="section">
			<h3>Specs</h3>
			<div class="specs">
				<div class="spec"><span class="k">Make</span><span class="v">{car.make ?? '—'}</span></div>
				<div class="spec"><span class="k">Model</span><span class="v">{car.model ?? '—'}</span></div>
				<div class="spec">
					<span class="k">Engine</span><span class="v">{car.engine ?? '—'}</span>
				</div>
				<div class="spec">
					<span class="k">Power</span><span class="v">{car.power ? car.power + ' cv' : '—'}</span>
				</div>
				<div class="spec">
					<span class="k">Location</span><span class="v">{car.location ?? '—'}</span>
				</div>
				<div class="spec">
					<span class="k">Distance</span>
					<span class="v">{distance != null ? distance + ' km' : '—'}</span>
				</div>
			</div>
		</section>

		<section class="section">
			<h3>Price history</h3>
			<div class="soft-card">
				<PriceHistoryTimeline history={car.priceHistory ?? []} />
			</div>
		</section>

		{#if scam.level !== 'none'}
			<section class="section">
				<h3>Scam risk</h3>
				<div class="scam-card {scam.level}">
					<div class="scam-head">
						<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
							<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
							<line x1="12" y1="9" x2="12" y2="13" />
							<line x1="12" y1="17" x2="12.01" y2="17" />
						</svg>
						<span>{scam.level === 'high' ? 'Likely scam — verify carefully' : 'Suspicious — worth a second look'}</span>
					</div>
					<ul class="scam-list">
						{#each scam.flags as f (f.id)}
							<li>{f.label}</li>
						{/each}
					</ul>
				</div>
			</section>
		{/if}

		{#if car.notes}
			<section class="section">
				<h3>Notes</h3>
				<div class="soft-card notes">{car.notes}</div>
			</section>
		{/if}

		<div class="actions">
			<button type="button" class="btn primary" onclick={() => onedit(car.id)}>Edit</button>
			<button type="button" class="btn ghost" onclick={onShare}>Share</button>
			<button type="button" class="btn ghost-danger" onclick={onDelete}>Delete</button>
		</div>
	</div>
</div>

<style>
	.detail-overlay {
		position: fixed;
		inset: 0;
		background: var(--bg-overlay);
		backdrop-filter: blur(4px);
		z-index: 60;
		animation: fadeUp var(--dur) var(--ease);
	}
	.detail-panel {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(460px, 100%);
		background: var(--card);
		z-index: 65;
		box-shadow: var(--shadow-xl);
		overflow-y: auto;
		animation: slideIn var(--dur) var(--ease);
	}
	.content {
		padding: 28px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.eyebrow {
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-dim);
	}
	.dot-sep {
		color: var(--ink-dim);
		margin: 0 4px;
	}
	.id {
		font-family: var(--mono);
		letter-spacing: 0.05em;
	}
	.close-btn {
		background: transparent;
		border: 0;
		width: 32px;
		height: 32px;
		border-radius: 8px;
		color: var(--ink-soft);
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.close-btn:hover {
		background: var(--card-2);
		color: var(--ink);
	}
	.close-btn svg {
		width: 14px;
		height: 14px;
	}
	.hero-img {
		width: 100%;
		max-height: 260px;
		object-fit: cover;
		border-radius: 12px;
		background: var(--card-2);
	}
	.title {
		font-size: 1.625rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--ink);
		line-height: 1.2;
		margin: 0;
	}
	.score-widget {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		align-self: flex-start;
		gap: 0;
	}
	.score-num {
		font-size: 1.3rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1;
	}
	.score-label {
		font-size: 0.55rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		margin-top: 2px;
		opacity: 0.85;
	}
	.price-line {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--ink);
	}
	.facts-line {
		font-size: 0.88rem;
		color: var(--ink-soft);
		margin-top: -8px;
	}
	.drop-badge {
		display: inline-block;
		background: var(--good-bg);
		color: var(--good);
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 0.76rem;
		font-weight: 600;
		align-self: flex-start;
	}
	.link-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		border-radius: 10px;
		background: var(--accent);
		color: #fff;
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 600;
		align-self: flex-start;
	}
	.link-btn:hover {
		background: var(--accent-hover);
	}
	.link-btn svg {
		width: 13px;
		height: 13px;
	}
	.section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	h3 {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-dim);
		margin: 0;
	}
	.status-switcher {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
	.status-chip {
		background: var(--card-2);
		border: 1px solid transparent;
		color: var(--ink-soft);
		padding: 6px 12px;
		border-radius: 999px;
		font-size: 0.76rem;
		font-weight: 500;
		transition: all var(--dur-fast) var(--ease);
	}
	.status-chip:hover {
		color: var(--ink);
		border-color: var(--rule);
	}
	.status-chip.active {
		background: var(--accent);
		color: #fff;
		border-color: var(--accent);
	}
	.status-chip.pending {
		opacity: 0.55;
		cursor: wait;
		pointer-events: none;
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
	.reason-tip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		margin-left: 8px;
		padding: 0;
		background: transparent;
		border: 1px solid var(--rule);
		border-radius: 50%;
		color: var(--ink-dim);
		font-family: var(--mono);
		font-size: 0.72rem;
		font-weight: 700;
		line-height: 1;
		cursor: pointer;
		vertical-align: 1px;
		transition:
			background var(--dur-fast) var(--ease),
			border-color var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease),
			transform var(--dur-fast) var(--ease);
	}
	.reason-tip:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.reason-tip:active {
		transform: scale(0.92);
	}
	.reason-tip[aria-expanded='true'] {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}
	.reason-tip:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.reason-tip.warn {
		border-color: var(--warn);
		color: var(--warn);
	}
	.reason-tip.warn:hover {
		background: var(--warn-bg);
	}
	.reason-tip.warn[aria-expanded='true'] {
		background: var(--warn);
		border-color: var(--warn);
		color: #fff;
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
	.specs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.spec {
		background: var(--card-2);
		border-radius: 10px;
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.spec .k {
		font-size: 0.66rem;
		color: var(--ink-dim);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
	}
	.spec .v {
		font-size: 0.88rem;
		color: var(--ink);
		font-weight: 500;
	}
	.soft-card {
		background: var(--card-2);
		border-radius: 10px;
		padding: 12px 14px;
	}
	.scam-card {
		border-radius: 10px;
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.scam-card.low {
		background: var(--warn-bg);
		color: var(--warn);
	}
	.scam-card.high {
		background: var(--bad-bg);
		color: var(--bad);
	}
	.scam-head {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 0.82rem;
		font-weight: 600;
	}
	.scam-list {
		margin: 0;
		padding-left: 22px;
		font-size: 0.78rem;
		line-height: 1.5;
	}
	.scam-list li {
		margin: 2px 0;
	}
	.notes {
		font-size: 0.86rem;
		color: var(--ink-soft);
		line-height: 1.55;
		white-space: pre-wrap;
	}
	.actions {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}
	.btn {
		padding: 10px 16px;
		border: 0;
		border-radius: 10px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all var(--dur-fast) var(--ease);
	}
	.btn.primary {
		background: var(--accent);
		color: #fff;
		flex: 1;
	}
	.btn.primary:hover {
		background: var(--accent-hover);
	}
	.btn.ghost {
		background: transparent;
		color: var(--ink);
		border: 1px solid var(--rule);
	}
	.btn.ghost:hover {
		background: var(--card-2);
	}
	.btn.ghost-danger {
		background: transparent;
		color: var(--bad);
		border: 1px solid var(--rule);
	}
	.btn.ghost-danger:hover {
		background: var(--bad-bg);
		border-color: var(--bad-bg);
	}
</style>
