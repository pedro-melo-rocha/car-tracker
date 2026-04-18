<script lang="ts">
	import type { Car } from '$lib/types';
	import { computeScore, computeScoreBreakdown } from '$lib/scoring';
	import { SCORE_WEIGHTS } from '$lib/constants';
	import ScoreBadge from '$components/ui/ScoreBadge.svelte';
	import StatusPill from '$components/ui/StatusPill.svelte';
	import PriceHistoryTimeline from './PriceHistoryTimeline.svelte';
	import { deleteCar as removeCar } from '$lib/stores/cars';
	import { confirmDialog } from '$lib/stores/ui';

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
	const engineLine = $derived(
		[car.engine, car.power ? car.power + 'cv' : ''].filter(Boolean).join(' · ')
	);

	function barCls(v: number) {
		return v >= 75 ? '' : v >= 50 ? 'mid' : 'low';
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

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	$effect(() => {
		document.addEventListener('keydown', onKeydown);
		return () => document.removeEventListener('keydown', onKeydown);
	});
</script>

<div class="detail-overlay" onclick={onclose} role="presentation"></div>
<aside class="detail-panel" role="dialog" aria-modal="true" aria-label="Car details">
	<button type="button" class="close-btn" onclick={onclose} aria-label="Close">×</button>
	<div class="content">
		<div class="title">{car.title}</div>
		<div class="badges">
			<StatusPill status={car.status} />
			{#if car.source}<span class="source-tag">{car.source}</span>{/if}
		</div>
		<div class="score-row">
			<ScoreBadge {score} size="lg" />
		</div>

		<div class="breakdown">
			<div class="br-row">
				<span class="br-label">Kms</span>
				<span class="br-bar"
					><span class="br-fill {barCls(breakdown.km)}" style="width:{breakdown.km}%"></span></span
				>
				<span class="br-weight">{Math.round(SCORE_WEIGHTS.km * 100)}%</span>
				<span class="br-value">{breakdown.km}</span>
			</div>
			<div class="br-row">
				<span class="br-label">Price</span>
				<span class="br-bar"
					><span class="br-fill {barCls(breakdown.price)}" style="width:{breakdown.price}%"
					></span></span
				>
				<span class="br-weight">{Math.round(SCORE_WEIGHTS.price * 100)}%</span>
				<span class="br-value">{breakdown.price}</span>
			</div>
			<div class="br-row">
				<span class="br-label">Reliability</span>
				<span class="br-bar"
					><span
						class="br-fill {barCls(breakdown.rel.score)}"
						style="width:{breakdown.rel.score}%"
					></span></span
				>
				<span class="br-weight">{Math.round(SCORE_WEIGHTS.reliability * 100)}%</span>
				<span class="br-value">{breakdown.rel.score}</span>
			</div>
			{#if breakdown.rel.reason}
				<div class="br-reason" class:pos={breakdown.rel.delta > 0} class:neg={breakdown.rel.delta < 0}>
					{breakdown.rel.delta > 0 ? '+' : ''}{breakdown.rel.delta} · {breakdown.rel.reason}
				</div>
			{/if}
			<div class="br-row">
				<span class="br-label">Year</span>
				<span class="br-bar"
					><span class="br-fill {barCls(breakdown.year)}" style="width:{breakdown.year}%"
					></span></span
				>
				<span class="br-weight">{Math.round(SCORE_WEIGHTS.year * 100)}%</span>
				<span class="br-value">{breakdown.year}</span>
			</div>
			<div class="br-row">
				<span class="br-label">Location</span>
				<span class="br-bar"
					><span class="br-fill {barCls(breakdown.loc)}" style="width:{breakdown.loc}%"></span
					></span
				>
				<span class="br-weight">{Math.round(SCORE_WEIGHTS.location * 100)}%</span>
				<span class="br-value">{breakdown.loc}</span>
			</div>
		</div>

		<div class="grid">
			<div class="cell"><label>Year</label><span>{car.year ?? '—'}</span></div>
			<div class="cell"><label>Km</label><span>{car.km ? car.km.toLocaleString() : '—'}</span></div>
			<div class="cell"><label>Fuel</label><span>{car.fuel ?? '—'}</span></div>
			<div class="cell">
				<label>Price</label>
				<span class="price">{car.price ? '€' + car.price.toLocaleString() : '—'}</span>
			</div>
			{#if engineLine}
				<div class="cell wide"><label>Engine</label><span>{engineLine}</span></div>
			{/if}
			{#if car.location}
				<div class="cell wide"><label>Local</label><span>📍 {car.location}</span></div>
			{/if}
		</div>

		{#if car.url}
			<a href={car.url} target="_blank" rel="noopener noreferrer" class="link-btn">
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 3H3v10h10v-3M9 1h6v6M7 9L15 1" />
				</svg>
				Open Listing
			</a>
		{/if}

		{#if car.notes}
			<section>
				<h3>Notes</h3>
				<div class="notes">{car.notes}</div>
			</section>
		{/if}

		<section>
			<h3>Price History</h3>
			<PriceHistoryTimeline history={car.priceHistory ?? []} />
		</section>

		<div class="actions">
			<button type="button" class="btn primary" onclick={() => onedit(car.id)}>Edit</button>
			<button type="button" class="btn danger" onclick={onDelete}>Delete</button>
		</div>
	</div>
</aside>

<style>
	.detail-overlay {
		position: fixed;
		inset: 0;
		background: var(--bg-overlay);
		z-index: 60;
		animation: fadeUp var(--dur) var(--ease);
	}
	.detail-panel {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(460px, 100%);
		background: var(--bg-card);
		z-index: 65;
		box-shadow: var(--shadow-xl);
		overflow-y: auto;
		animation: slideIn var(--dur) var(--ease);
	}
	.close-btn {
		position: absolute;
		top: 10px;
		right: 12px;
		background: transparent;
		border: 0;
		font-size: 1.5rem;
		line-height: 1;
		color: var(--text-secondary);
		cursor: pointer;
		z-index: 1;
	}
	.content {
		padding: 1.5rem 1.5rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.title {
		font-size: 1.25rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		padding-right: 40px;
		line-height: 1.3;
	}
	.badges {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
	.source-tag {
		background: var(--blue-bg);
		color: var(--blue);
		padding: 3px 10px;
		border-radius: 20px;
		font-size: 0.72rem;
		font-weight: 600;
	}
	.score-row {
		display: flex;
	}
	.breakdown {
		background: var(--bg);
		border-radius: var(--radius-md);
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.br-row {
		display: grid;
		grid-template-columns: 90px 1fr 36px 32px;
		gap: 8px;
		align-items: center;
	}
	.br-label {
		font-size: 0.78rem;
		color: var(--text-secondary);
	}
	.br-bar {
		height: 6px;
		background: var(--bg-warm);
		border-radius: 3px;
		position: relative;
		overflow: hidden;
	}
	.br-fill {
		position: absolute;
		inset: 0 auto 0 0;
		background: var(--green);
	}
	.br-fill.mid {
		background: var(--yellow);
	}
	.br-fill.low {
		background: var(--red);
	}
	.br-weight {
		font-size: 0.72rem;
		color: var(--text-muted);
		text-align: right;
	}
	.br-value {
		font-family: var(--mono);
		font-weight: 700;
		font-size: 0.82rem;
		text-align: right;
		color: var(--text);
	}
	.br-reason {
		grid-column: 1 / -1;
		font-size: 0.72rem;
		padding: 4px 8px;
		border-radius: 4px;
		color: var(--text-secondary);
	}
	.br-reason.pos {
		background: var(--green-bg);
		color: var(--green);
	}
	.br-reason.neg {
		background: var(--red-bg);
		color: var(--red);
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	.cell {
		background: var(--bg);
		border-radius: var(--radius-md);
		padding: 10px 12px;
	}
	.cell label {
		display: block;
		font-size: 0.72rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		font-weight: 600;
	}
	.cell span {
		display: block;
		margin-top: 2px;
		font-size: 0.95rem;
		font-weight: 600;
	}
	.cell.wide {
		grid-column: 1 / -1;
	}
	.price {
		color: var(--green);
	}
	.link-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 0.55rem 1rem;
		border-radius: var(--radius-md);
		background: var(--bg);
		color: var(--text);
		text-decoration: none;
		font-size: var(--fs-sm);
		font-weight: 600;
		width: fit-content;
	}
	.link-btn svg {
		width: 14px;
		height: 14px;
	}
	h3 {
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 6px;
	}
	.notes {
		font-size: 0.88rem;
		color: var(--text-secondary);
		line-height: 1.55;
		white-space: pre-wrap;
	}
	.actions {
		display: flex;
		gap: 8px;
		margin-top: 0.5rem;
	}
	.btn {
		padding: 0.55rem 1rem;
		border: 0;
		border-radius: var(--radius-md);
		font-size: var(--fs-sm);
		font-weight: 600;
		cursor: pointer;
	}
	.btn.primary {
		background: var(--accent);
		color: #fff;
	}
	.btn.danger {
		background: var(--red-bg);
		color: var(--red);
	}
</style>
