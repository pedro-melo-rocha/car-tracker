<script lang="ts">
	import type { Car } from '$lib/types';
	import { cars } from '$lib/stores/cars';
	import { computeScore, computeScoreBreakdown, detectScamRisk, locationKm } from '$lib/scoring';
	import ScoreBadge from '$components/ui/ScoreBadge.svelte';

	let {
		ids,
		onclose,
		onremove,
		onopen
	}: {
		ids: string[];
		onclose: () => void;
		onremove: (id: string) => void;
		onopen: (id: string) => void;
	} = $props();

	// Keep the order the cars were picked in.
	const selected = $derived(
		ids.map((id) => $cars.find((c) => c.id === id)).filter((c): c is Car => !!c)
	);

	function relOf(c: Car) {
		return computeScoreBreakdown(c).rel.score;
	}

	function relReason(c: Car): { text: string; matched: boolean } {
		const r = computeScoreBreakdown(c).rel;
		if (r.matched && r.reason) {
			return { text: `${r.delta > 0 ? '+' : ''}${r.delta}: ${r.reason}`, matched: true };
		}
		return {
			text: `Engine not recognised, so this uses the ${c.make || 'default'} baseline (${r.base}/100).`,
			matched: false
		};
	}

	let openReasonId = $state<string | null>(null);

	function uniqueBest(
		list: Car[],
		valueOf: (c: Car) => number | null | undefined,
		direction: 'min' | 'max'
	): string | null {
		const vals = list
			.map((c) => ({ id: c.id, v: valueOf(c) }))
			.filter((x): x is { id: string; v: number } => x.v != null && x.v !== 0);
		if (vals.length < 2) return null;
		const best = vals.reduce((a, b) =>
			direction === 'min' ? (a.v < b.v ? a : b) : a.v > b.v ? a : b
		);
		return vals.filter((x) => x.v === best.v).length === 1 ? best.id : null;
	}

	type Row = {
		key: string;
		label: string;
		get: (c: Car) => string;
		winner?: (list: Car[]) => string | null;
		big?: boolean;
	};

	const rows: Row[] = [
		{
			key: 'price',
			label: 'Price',
			big: true,
			get: (c) => (c.price ? '€' + c.price.toLocaleString('pt-PT') : '–'),
			winner: (l) => uniqueBest(l, (c) => c.price, 'min')
		},
		{
			key: 'km',
			label: 'Km',
			get: (c) => (c.km ? c.km.toLocaleString('pt-PT') + ' km' : '–'),
			winner: (l) => uniqueBest(l, (c) => c.km, 'min')
		},
		{
			key: 'year',
			label: 'Year',
			get: (c) => (c.year ? String(c.year) : '–'),
			winner: (l) => uniqueBest(l, (c) => c.year, 'max')
		},
		{ key: 'fuel', label: 'Fuel', get: (c) => c.fuel ?? '–' },
		{ key: 'engine', label: 'Engine', get: (c) => c.engine ?? '–' },
		{ key: 'power', label: 'Power', get: (c) => (c.power ? c.power + ' cv' : '–') },
		{ key: 'gearbox', label: 'Gearbox', get: (c) => c.gearbox ?? '–' },
		{
			key: 'owners',
			label: 'Owners',
			get: (c) => (c.owners != null ? String(c.owners) : '–'),
			winner: (l) => uniqueBest(l, (c) => c.owners, 'min')
		},
		{
			key: 'distance',
			label: 'Distance',
			get: (c) => {
				const d = locationKm(c.location);
				const place = c.location ?? '–';
				return d != null ? `${place}, ${d} km` : place;
			},
			winner: (l) => uniqueBest(l, (c) => locationKm(c.location), 'min')
		},
		{
			key: 'reliability',
			label: 'Reliability',
			get: (c) => relOf(c) + '/100',
			winner: (l) => uniqueBest(l, relOf, 'max')
		},
		{
			key: 'risk',
			label: 'Scam risk',
			get: (c) => {
				const r = detectScamRisk(c, { peers: $cars });
				if (r.level === 'none') return 'No flags';
				return r.flags.map((f) => f.label).join('\n');
			}
		},
		{ key: 'notes', label: 'Notes', get: (c) => c.notes || '–' }
	];

	const highestId = $derived(uniqueBest(selected, computeScore, 'max'));

	const bestByRow = $derived.by(() => {
		const out: Record<string, string | null> = {};
		for (const r of rows) out[r.key] = r.winner ? r.winner(selected) : null;
		return out;
	});

	let dialogEl: HTMLDivElement | undefined = $state();
	$effect(() => {
		dialogEl?.focus();
	});
</script>

<div class="overlay" role="presentation" onclick={onclose}>
	<div
		class="sheet"
		role="dialog"
		aria-modal="true"
		aria-labelledby="compare-title"
		tabindex="-1"
		bind:this={dialogEl}
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => {
			if (e.key === 'Escape') onclose();
		}}
	>
		<header class="sheet-head">
			<h2 id="compare-title">{selected.length >= 2 ? `Comparing ${selected.length} cars` : 'Compare cars'}</h2>
			<button type="button" class="close" onclick={onclose} aria-label="Close comparison">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
					<line x1="6" y1="6" x2="18" y2="18" />
					<line x1="18" y1="6" x2="6" y2="18" />
				</svg>
			</button>
		</header>

		{#if selected.length < 2}
			<p class="empty">
				Pick at least two cars to compare. Select them in the list, or use “Compare” on a car’s
				page.
			</p>
		{:else}
			<div class="cards" style="--n: {selected.length}">
				{#each selected as c (c.id)}
					<article class="card" class:highest={highestId === c.id}>
						{#if c.imageUrl}
							<img
								class="card-img"
								src={c.imageUrl}
								alt=""
								loading="lazy"
								onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
							/>
						{/if}
						<div class="card-head">
							<ScoreBadge score={computeScore(c)} size="lg" />
							<div class="head-text">
								<button type="button" class="head-title" onclick={() => onopen(c.id)}>
									{c.title}
								</button>
								<div class="head-meta">
									{c.source ?? 'Unknown source'}
									{#if highestId === c.id}<span class="highest-note">Highest score</span>{/if}
								</div>
							</div>
							<button
								type="button"
								class="remove"
								aria-label="Remove {c.title} from comparison"
								onclick={() => onremove(c.id)}
							>
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
									<line x1="6" y1="6" x2="18" y2="18" />
									<line x1="18" y1="6" x2="6" y2="18" />
								</svg>
							</button>
						</div>
						<dl class="rows">
							{#each rows as r (r.key)}
								{@const isWinner = bestByRow[r.key] === c.id}
								{@const isRel = r.key === 'reliability'}
								{@const reason = isRel ? relReason(c) : null}
								{@const reasonKey = `${c.id}:rel`}
								{@const reasonOpen = isRel && openReasonId === reasonKey}
								<div class="row" class:winner={isWinner}>
									<dt>{r.label}</dt>
									<dd class:big={r.big}>
										{r.get(c)}
										{#if reason}
											<button
												type="button"
												class="reason-tip"
												class:warn={!reason.matched}
												aria-expanded={reasonOpen}
												aria-label="Why this reliability score"
												onclick={() => (openReasonId = reasonOpen ? null : reasonKey)}
											>
												?
											</button>
										{/if}
									</dd>
								</div>
								{#if reasonOpen && reason}
									<div class="reason-row" class:warn={!reason.matched}>{reason.text}</div>
								{/if}
							{/each}
						</dl>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: var(--bg-overlay);
		z-index: 80;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 2rem 1rem;
		overflow-y: auto;
		animation: fadeIn var(--dur) var(--ease);
	}
	.sheet {
		background: var(--bg);
		border-radius: var(--radius-xl);
		width: 100%;
		max-width: 1280px;
		padding: 20px 24px 28px;
		box-shadow: var(--shadow-xl);
		outline: none;
	}
	.sheet-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}
	.sheet-head h2 {
		font-size: 1.15rem;
		font-weight: 700;
		letter-spacing: -0.015em;
	}
	.close,
	.remove {
		background: transparent;
		border: 0;
		width: 32px;
		height: 32px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		color: var(--ink-soft);
		flex-shrink: 0;
	}
	.close:hover,
	.remove:hover {
		background: var(--card-2);
		color: var(--ink);
	}
	.empty {
		padding: 48px 16px;
		text-align: center;
		color: var(--ink-soft);
		font-size: 0.9rem;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		gap: 14px;
	}
	.card {
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	.card.highest {
		border-color: var(--accent);
	}
	.card-img {
		width: 100%;
		height: 150px;
		object-fit: cover;
		display: block;
		background: var(--card-2);
	}
	.card-head {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 16px;
		border-bottom: 1px solid var(--rule);
	}
	.head-text {
		flex: 1;
		min-width: 0;
	}
	.head-title {
		background: transparent;
		border: 0;
		padding: 0;
		text-align: left;
		font-size: 0.98rem;
		font-weight: 600;
		letter-spacing: -0.015em;
		line-height: 1.3;
		color: var(--ink);
		text-wrap: balance;
	}
	.head-title:hover {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.head-meta {
		margin-top: 3px;
		font-size: 0.78rem;
		color: var(--ink-soft);
	}
	.highest-note {
		color: var(--accent);
		font-weight: 600;
	}
	.highest-note::before {
		content: ' · ';
		color: var(--ink-dim);
		font-weight: 400;
	}
	.rows {
		margin: 0;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		padding: 9px 16px;
		border-bottom: 1px solid var(--rule);
	}
	.row:last-child {
		border-bottom: 0;
	}
	.row dt {
		font-size: 0.8rem;
		color: var(--ink-soft);
		flex-shrink: 0;
	}
	.row dd {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 500;
		text-align: right;
		white-space: pre-wrap;
		font-variant-numeric: tabular-nums;
	}
	.row dd.big {
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	.row.winner {
		background: var(--good-bg);
	}
	.row.winner dt,
	.row.winner dd {
		color: var(--good);
		font-weight: 600;
	}
	.reason-tip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		margin-left: 6px;
		padding: 0;
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: 50%;
		color: var(--ink-soft);
		font-size: 0.75rem;
		font-weight: 700;
		line-height: 1;
		vertical-align: 1px;
	}
	.reason-tip:hover,
	.reason-tip[aria-expanded='true'] {
		border-color: var(--accent);
		color: var(--accent);
	}
	.reason-tip.warn {
		border-color: var(--warn);
		color: var(--warn);
	}
	.reason-row {
		padding: 8px 16px 12px;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--ink-soft);
		background: var(--card-2);
		border-bottom: 1px solid var(--rule);
	}
	.reason-row.warn {
		background: var(--warn-bg);
		color: var(--status-negotiating-fg);
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@media (max-width: 900px) {
		.overlay {
			padding: 0;
		}
		.sheet {
			border-radius: 0;
			min-height: 100%;
			padding: 14px 12px 24px;
		}
		.cards {
			grid-template-columns: 1fr;
		}
	}
</style>
