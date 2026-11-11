<script lang="ts">
	import type { PageData } from './$types';
	import { computeScore, computeScoreBreakdown, detectScamRisk, locationKm } from '$lib/scoring';
	import { netPriceDrop } from '$lib/price';
	import { SCORE_WEIGHTS } from '$lib/constants';
	import PriceHistoryTimeline from '$components/car/PriceHistoryTimeline.svelte';
	import ScoreBadge from '$components/ui/ScoreBadge.svelte';
	import PlateMark from '$components/ui/PlateMark.svelte';

	let { data }: { data: PageData } = $props();
	const car = $derived(data.car);

	const score = $derived(computeScore(car));
	const breakdown = $derived(computeScoreBreakdown(car));
	const scam = $derived(detectScamRisk(car, { peers: [] }));
	const distance = $derived(locationKm(car.location));
	const priceDrop = $derived(netPriceDrop(car.priceHistory));

	function barCls(v: number) {
		return v >= 70 ? 'good' : v >= 50 ? 'warn' : 'bad';
	}
</script>

<svelte:head>
	<title>{car.title}</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="page">
	<div class="topbar">
		<a href="/" class="back-btn" data-sveltekit-reload>
			<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path d="M10 13L5 8l5-5" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
			Back to Achado
		</a>
	</div>
	<article class="content">
		{#if car.imageUrl}
			<img
				class="hero-image"
				src={car.imageUrl}
				alt={car.title}
				loading="eager"
				onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
			/>
		{/if}
		<div class="source">{car.source ?? 'Unknown source'}</div>

		<h1 class="title">{car.title}</h1>

		<div class="hero">
			<ScoreBadge {score} size="lg" />
			<div class="hero-text">
				<div class="price-line">
					{car.price ? '€' + car.price.toLocaleString('pt-PT') : '–'}
				</div>
				<div class="facts-line">
					{car.km ? car.km.toLocaleString('pt-PT') + ' km' : '–'}
					<span class="dot-sep">·</span>
					{car.year ?? '–'}
					<span class="dot-sep">·</span>
					{car.fuel ?? '–'}
				</div>
				{#if priceDrop > 0}
					<div class="drop-note">Down €{priceDrop.toLocaleString('pt-PT')} since first seen</div>
				{/if}
			</div>
		</div>

		{#if scam.level === 'high'}
			<div class="scam-card high" role="note">
				<div class="scam-head">Likely scam. Check these before calling:</div>
				<ul class="scam-list">
					{#each scam.flags as f (f.id)}
						<li>{f.label}</li>
					{/each}
				</ul>
			</div>
		{:else if scam.level === 'low'}
			<p class="scam-note" role="note">
				<strong>Worth checking:</strong> {scam.flags.map((f) => f.label).join('; ')}.
			</p>
		{/if}

		{#if car.url}
			<a href={car.url} target="_blank" rel="noopener noreferrer" class="link-btn">
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M6 3H3v10h10v-3M9 1h6v6M7 9L15 1" />
				</svg>
				Open original listing
			</a>
		{/if}

		<section class="section">
			<h3>Score breakdown</h3>
			<div class="breakdown">
				<div class="br-row">
					<span class="br-label">Km</span>
					<span class="br-weight">weight {Math.round(SCORE_WEIGHTS.km * 100)}%</span>
					<span class="br-value">{breakdown.km}<span class="br-div">/100</span></span>
					<span class="br-bar"
						><span class="br-fill {barCls(breakdown.km)}" style="width:{breakdown.km}%"
						></span></span
					>
				</div>
				<div class="br-row">
					<span class="br-label">Price</span>
					<span class="br-weight">weight {Math.round(SCORE_WEIGHTS.price * 100)}%</span>
					<span class="br-value">{breakdown.price}<span class="br-div">/100</span></span>
					<span class="br-bar"
						><span class="br-fill {barCls(breakdown.price)}" style="width:{breakdown.price}%"
						></span></span
					>
				</div>
				<div class="br-row">
					<span class="br-label">Reliability</span>
					<span class="br-weight">weight {Math.round(SCORE_WEIGHTS.reliability * 100)}%</span>
					<span class="br-value">{breakdown.rel.score}<span class="br-div">/100</span></span>
					<span class="br-bar"
						><span
							class="br-fill {barCls(breakdown.rel.score)}"
							style="width:{breakdown.rel.score}%"
						></span></span
					>
				</div>
				{#if breakdown.rel.matched && breakdown.rel.reason}
					<div
						class="br-reason"
						class:pos={breakdown.rel.delta > 0}
						class:neg={breakdown.rel.delta < 0}
					>
						{breakdown.rel.delta > 0 ? '+' : ''}{breakdown.rel.delta}: {breakdown.rel.reason}
					</div>
				{/if}
				<div class="br-row">
					<span class="br-label">Year</span>
					<span class="br-weight">weight {Math.round(SCORE_WEIGHTS.year * 100)}%</span>
					<span class="br-value">{breakdown.year}<span class="br-div">/100</span></span>
					<span class="br-bar"
						><span class="br-fill {barCls(breakdown.year)}" style="width:{breakdown.year}%"
						></span></span
					>
				</div>
				<div class="br-row">
					<span class="br-label">Location</span>
					<span class="br-weight">weight {Math.round(SCORE_WEIGHTS.location * 100)}%</span>
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
				<div class="spec"><span class="k">Make</span><span class="v">{car.make ?? '–'}</span></div>
				<div class="spec">
					<span class="k">Model</span><span class="v">{car.model ?? '–'}</span>
				</div>
				<div class="spec">
					<span class="k">Engine</span><span class="v">{car.engine ?? '–'}</span>
				</div>
				<div class="spec">
					<span class="k">Power</span><span class="v">{car.power ? car.power + ' cv' : '–'}</span>
				</div>
				<div class="spec">
					<span class="k">Location</span><span class="v">{car.location ?? '–'}</span>
				</div>
				<div class="spec">
					<span class="k">Distance from Viana</span>
					<span class="v">{distance != null ? distance + ' km' : '–'}</span>
				</div>
			</div>
		</section>

		<section class="section">
			<h3>Price history</h3>
			<div class="soft-card">
				<PriceHistoryTimeline history={car.priceHistory ?? []} />
			</div>
		</section>

		<footer class="foot">Shared from <PlateMark size="sm" /></footer>
	</article>
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--bg);
		padding: 2rem 1rem 4rem;
	}
	.topbar {
		max-width: 680px;
		margin: 0 auto 14px;
	}
	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--ink-soft);
		text-decoration: none;
		padding: 6px 2px;
	}
	.back-btn:hover {
		color: var(--ink);
	}
	.back-btn svg {
		width: 14px;
		height: 14px;
	}
	.content {
		max-width: 680px;
		margin: 0 auto;
		background: var(--card);
		border-radius: var(--radius-lg, 14px);
		padding: 28px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		box-shadow: var(--shadow-xl);
	}
	.hero-image {
		width: 100%;
		max-height: 320px;
		object-fit: cover;
		border-radius: 10px;
		background: var(--card-2);
		margin-bottom: 4px;
	}
	.source {
		font-size: 0.85rem;
		color: var(--ink-soft);
	}
	.dot-sep {
		color: var(--ink-dim);
		margin: 0 4px;
	}
	.title {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--ink);
		line-height: 1.2;
		margin: 0;
	}
	.hero {
		display: flex;
		align-items: center;
		gap: 18px;
		flex-wrap: wrap;
	}
	.hero-text {
		display: flex;
		flex-direction: column;
		gap: 4px;
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
	}
	.drop-note {
		margin-top: 4px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--good);
	}
	.scam-note {
		font-size: 0.88rem;
		line-height: 1.5;
		color: var(--ink-soft);
		padding: 10px 12px;
		border-radius: 10px;
		background: var(--card-2);
	}
	.scam-note strong {
		color: var(--status-negotiating-fg);
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
		font-size: 0.95rem;
		font-weight: 650;
		letter-spacing: -0.01em;
		color: var(--ink);
		margin: 0;
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
		font-size: 0.8rem;
		color: var(--ink-soft);
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
		font-size: 0.75rem;
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
		font-size: 0.8rem;
		color: var(--ink-soft);
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
	.foot {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 8px;
		font-size: 0.82rem;
		color: var(--ink-soft);
	}
	@media (max-width: 560px) {
		.page {
			padding: 0.75rem;
		}
		.content {
			padding: 18px;
		}
		.title {
			font-size: 1.4rem;
		}
		.price-line {
			font-size: 1.4rem;
		}
		.specs {
			grid-template-columns: 1fr;
		}
	}
</style>

