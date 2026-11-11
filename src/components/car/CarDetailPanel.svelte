<script lang="ts">
	import type { Car } from '$lib/types';
	import { STATUSES, STATUS_LABELS, type CarStatus } from '$lib/types';
	import { computeScore, computeScoreBreakdown, detectScamRisk, locationKm } from '$lib/scoring';
	import { netPriceDrop } from '$lib/price';
	import { SCORE_WEIGHTS } from '$lib/constants';
	import PriceHistoryTimeline from './PriceHistoryTimeline.svelte';
	import { cars, deleteCar as removeCar, updateCar } from '$lib/stores/cars';
	import { confirmDialog, toast } from '$lib/stores/ui';
	import { compareIds, toggleCompare } from '$lib/stores/compare';
	import { daysUntilStale } from '$lib/staleness';

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
	const daysListed = $derived(
		car.listedAt ? Math.max(0, Math.floor((Date.now() - Date.parse(car.listedAt)) / 86_400_000)) : null
	);
	const hasListingSignals = $derived(
		car.sellerType != null ||
			car.sellerSince != null ||
			car.gearbox != null ||
			car.owners != null ||
			car.warrantyMonths != null ||
			car.imported != null ||
			daysListed != null
	);
	const priceDrop = $derived(netPriceDrop(car.priceHistory));

	const scoreTone = $derived(score >= 70 ? 'good' : score >= 50 ? 'warn' : 'bad');
	const inCompare = $derived($compareIds.includes(car.id));

	const staleIn = $derived(daysUntilStale(car));

	// "What if" simulation: try another price or km without saving anything.
	let simOpen = $state(false);
	let simPrice = $state<number | null>(null);
	let simKm = $state<number | null>(null);
	const simCar = $derived({ ...car, price: simPrice ?? car.price, km: simKm ?? car.km });
	const simChanged = $derived(
		(simPrice != null && simPrice !== car.price) || (simKm != null && simKm !== car.km)
	);
	const simScore = $derived(computeScore(simCar));
	const shown = $derived(simOpen && simChanged ? computeScoreBreakdown(simCar) : breakdown);
	const shownRows = $derived([
		{ key: 'km', label: 'Km', weight: Math.round(SCORE_WEIGHTS.km * 100), value: shown.km },
		{ key: 'price', label: 'Price', weight: Math.round(SCORE_WEIGHTS.price * 100), value: shown.price },
		{ key: 'rel', label: 'Reliability', weight: Math.round(SCORE_WEIGHTS.reliability * 100), value: shown.rel.score },
		{ key: 'year', label: 'Year', weight: Math.round(SCORE_WEIGHTS.year * 100), value: shown.year },
		{ key: 'loc', label: 'Location', weight: Math.round(SCORE_WEIGHTS.location * 100), value: shown.loc }
	]);

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

	async function setStatus(next: CarStatus, undoable = true) {
		if (car.status === next || pendingStatus !== null) return;
		const previous = car.status;
		pendingStatus = next;
		try {
			await updateCar(car.id, { status: next });
			if (undoable) {
				toast.action(
					`Moved to ${STATUS_LABELS[next]}`,
					{ label: 'Undo', onClick: () => void setStatus(previous, false) },
					6000,
					'success'
				);
			}
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
<div class="detail-panel" role="dialog" aria-modal="true" aria-labelledby="detail-title" tabindex="-1">
	<div class="content">
		<div class="head">
			<div class="source">
				{car.source ?? 'Unknown source'}{#if daysListed != null}<span class="dot-sep">·</span>listed {daysListed} days ago{/if}
			</div>
			<button type="button" class="close-btn" onclick={onclose} aria-label="Close">
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
					<path d="M4 4l8 8M12 4l-8 8" />
				</svg>
			</button>
		</div>

		<h1 class="title" id="detail-title">{car.title}</h1>

		{#if car.imageUrl}
			<img
				class="hero-img"
				src={car.imageUrl}
				alt=""
				loading="lazy"
				onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
			/>
		{/if}

		<div class="price-block">
			<div class="score-widget {scoreTone}" role="img" aria-label="Score {score} out of 100">
				{score}
			</div>
			<div>
				<div class="price-line">{car.price ? '€' + car.price.toLocaleString('pt-PT') : 'No price'}</div>
				<div class="facts-line">
					{car.km ? car.km.toLocaleString('pt-PT') + ' km' : 'km unknown'}
					<span class="dot-sep">·</span>
					{car.year ?? 'year unknown'}
					<span class="dot-sep">·</span>
					{car.fuel ?? 'fuel unknown'}
				</div>
				{#if priceDrop > 0}
					<div class="drop-note">Down €{priceDrop.toLocaleString('pt-PT')} since first seen</div>
				{/if}
			</div>
		</div>

		{#if scam.level === 'high'}
			<div class="scam-card high" role="note">
				<div class="scam-head">
					<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
						<line x1="12" y1="9" x2="12" y2="13" />
						<line x1="12" y1="17" x2="12.01" y2="17" />
					</svg>
					Likely scam. Check these before you call:
				</div>
				<ul class="scam-list">
					{#each scam.flags as f (f.id)}
						<li>{f.label}</li>
					{/each}
				</ul>
			</div>
		{:else if scam.level === 'low'}
			<div class="scam-note" role="note">
				<strong>Worth checking:</strong>
				{scam.flags.map((f) => f.label).join('; ')}.
			</div>
		{/if}

		<div class="quick-actions">
			{#if car.url}
				<a href={car.url} target="_blank" rel="noopener noreferrer" class="link-btn">
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path d="M6 3H3v10h10v-3M9 1h6v6M7 9L15 1" />
					</svg>
					Open listing
				</a>
			{/if}
			<button
				type="button"
				class="btn ghost"
				aria-pressed={inCompare}
				onclick={() => toggleCompare(car.id)}
			>
				{inCompare ? 'Picked to compare' : 'Compare'}
			</button>
		</div>

		<section class="section">
			<h3>Status</h3>
			<div class="status-switcher" role="group" aria-label="Status">
				{#each STATUSES as s (s)}
					<button
						type="button"
						class="status-chip"
						class:active={car.status === s}
						class:pending={pendingStatus === s}
						aria-pressed={car.status === s}
						onclick={() => setStatus(s)}
					>
						{STATUS_LABELS[s]}
					</button>
				{/each}
			</div>
			{#if staleIn != null}
				<p class="hint">
					{staleIn <= 0
						? 'No reply yet. This moves to Dismissed on the next refresh.'
						: `No reply yet. Moves to Dismissed in ${staleIn} ${staleIn === 1 ? 'day' : 'days'} unless you update it.`}
				</p>
			{/if}
		</section>

		<section class="section">
			<div class="section-head">
				<h3>Score breakdown</h3>
				<a href="/docs" class="text-link">How the score works</a>
			</div>
			<div class="breakdown">
				{#each shownRows as r (r.key)}
					<div class="br-row">
						<span class="br-label">
							{r.label}
							{#if r.key === 'rel'}
								<button
									type="button"
									class="reason-tip"
									class:warn={!shown.rel.matched}
									aria-expanded={reasonOpen}
									aria-controls="reliability-reason"
									aria-label="Why this reliability score"
									onclick={() => (reasonOpen = !reasonOpen)}
								>
									?
								</button>
							{/if}
						</span>
						<span class="br-weight">weight {r.weight}%</span>
						<span class="br-value">{r.value}<span class="br-div">/100</span></span>
						<span class="br-bar"><span class="br-fill {barCls(r.value)}" style="width:{r.value}%"></span></span>
					</div>
					{#if r.key === 'rel' && reasonOpen}
						<div
							id="reliability-reason"
							class="br-reason"
							class:pos={shown.rel.matched && shown.rel.delta > 0}
							class:neg={shown.rel.matched && shown.rel.delta < 0}
						>
							{#if shown.rel.matched && shown.rel.reason}
								{shown.rel.delta > 0 ? '+' : ''}{shown.rel.delta}: {shown.rel.reason}
							{:else}
								No engine profile matched, so this uses the make’s baseline ({shown.rel.base}/100). A more precise engine name gives a more specific score.
							{/if}
						</div>
					{/if}
				{/each}
			</div>

			<details class="what-if" bind:open={simOpen}>
				<summary>What if the price or km were different?</summary>
				<div class="sim-fields">
					<label>
						<span>Price (€)</span>
						<input type="number" min="0" step="100" bind:value={simPrice} placeholder={car.price ? String(car.price) : ''} />
					</label>
					<label>
						<span>Km</span>
						<input type="number" min="0" step="1000" bind:value={simKm} placeholder={car.km ? String(car.km) : ''} />
					</label>
				</div>
				<p class="sim-result" aria-live="polite">
					{#if simChanged}
						Score would be <strong>{simScore}</strong>
						({simScore - score >= 0 ? '+' : ''}{simScore - score} from {score}). Nothing is saved.
					{:else}
						Change a value to see the new score. Nothing is saved.
					{/if}
				</p>
			</details>
		</section>

		<section class="section">
			<h3>Specs</h3>
			<div class="specs">
				<div class="spec"><span class="k">Make</span><span class="v">{car.make ?? '–'}</span></div>
				<div class="spec"><span class="k">Model</span><span class="v">{car.model ?? '–'}</span></div>
				<div class="spec"><span class="k">Engine</span><span class="v">{car.engine ?? '–'}</span></div>
				<div class="spec">
					<span class="k">Power</span><span class="v">{car.power ? car.power + ' cv' : '–'}</span>
				</div>
				<div class="spec"><span class="k">Location</span><span class="v">{car.location ?? '–'}</span></div>
				<div class="spec">
					<span class="k">Distance from Viana</span>
					<span class="v">{distance != null ? distance + ' km' : '–'}</span>
				</div>
				{#if car.gearbox}
					<div class="spec"><span class="k">Gearbox</span><span class="v">{car.gearbox}</span></div>
				{/if}
			</div>
		</section>

		{#if hasListingSignals}
			<section class="section">
				<h3>Seller and listing</h3>
				<div class="specs">
					<div class="spec">
						<span class="k">Seller</span>
						<span class="v">{car.sellerType === 'dealer' ? 'Dealer' : car.sellerType === 'private' ? 'Private' : '–'}</span>
					</div>
					<div class="spec">
						<span class="k">Account since</span><span class="v">{car.sellerSince ?? '–'}</span>
					</div>
					<div class="spec"><span class="k">Owners</span><span class="v">{car.owners ?? '–'}</span></div>
					<div class="spec">
						<span class="k">Warranty</span>
						<span class="v">{car.warrantyMonths ? car.warrantyMonths + ' months' : '–'}</span>
					</div>
					<div class="spec">
						<span class="k">Imported</span>
						<span class="v">{car.imported == null ? '–' : car.imported ? 'Yes' : 'No'}</span>
					</div>
					<div class="spec">
						<span class="k">On the market</span>
						<span class="v">{daysListed != null ? daysListed + ' days' : '–'}</span>
					</div>
				</div>
			</section>
		{/if}

		{#if car.description}
			<section class="section">
				<details class="soft-card description">
					<summary>Listing description</summary>
					<p>{car.description}</p>
				</details>
			</section>
		{/if}

		<section class="section">
			<h3>Price history</h3>
			<div class="soft-card">
				<PriceHistoryTimeline history={car.priceHistory ?? []} />
			</div>
		</section>

		{#if car.notes}
			<section class="section">
				<h3>Notes</h3>
				<div class="soft-card notes">{car.notes}</div>
			</section>
		{/if}

		<div class="actions">
			<button type="button" class="btn primary" onclick={() => onedit(car.id)}>Edit</button>
			<button type="button" class="btn ghost" onclick={onShare}>Copy share link</button>
			<button type="button" class="btn ghost-danger" onclick={onDelete}>Delete</button>
		</div>
	</div>
</div>

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
	.source {
		font-size: 0.82rem;
		color: var(--ink-soft);
	}
	.dot-sep {
		color: var(--ink-dim);
		margin: 0 6px;
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
	.price-block {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.score-widget {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}
	.score-widget.good {
		background: var(--good-bg);
		color: var(--good);
	}
	.score-widget.warn {
		background: var(--warn-bg);
		color: var(--status-negotiating-fg);
	}
	.score-widget.bad {
		background: var(--bad-bg);
		color: var(--bad);
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
		margin-top: 2px;
	}
	.drop-note {
		margin-top: 4px;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--good);
	}
	.quick-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.btn.ghost[aria-pressed='true'] {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--accent-soft);
	}
	.scam-note {
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--ink-soft);
		padding: 10px 12px;
		border-radius: 10px;
		background: var(--card-2);
	}
	.scam-note strong {
		color: var(--status-negotiating-fg);
		font-weight: 600;
	}
	.hint {
		font-size: 0.82rem;
		color: var(--ink-soft);
		line-height: 1.45;
	}
	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}
	.text-link {
		font-size: 0.82rem;
		color: var(--accent);
		text-underline-offset: 3px;
	}
	.text-link:hover {
		color: var(--accent-hover);
	}
	.what-if {
		margin-top: 6px;
		border-top: 1px solid var(--rule);
		padding-top: 10px;
	}
	.what-if summary {
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--ink);
	}
	.sim-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-top: 10px;
	}
	.sim-fields label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 0.8rem;
		color: var(--ink-soft);
	}
	.sim-fields input {
		padding: 8px 10px;
		border: 1px solid var(--rule);
		border-radius: 8px;
		background: var(--card-2);
		font-size: 0.88rem;
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}
	.sim-fields input:focus {
		border-color: var(--accent);
		background: var(--card);
	}
	.sim-result {
		margin-top: 8px;
		font-size: 0.85rem;
		color: var(--ink-soft);
	}
	.sim-result strong {
		color: var(--ink);
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
		font-size: 0.92rem;
		font-weight: 650;
		letter-spacing: -0.01em;
		color: var(--ink);
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
		font-size: 0.78rem;
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
		color: var(--ink-soft);
		font-size: 0.75rem;
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
		font-size: 0.82rem;
		line-height: 1.45;
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
	.description summary {
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--ink);
	}
	.description p {
		margin: 0.6rem 0 0;
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--ink);
		white-space: pre-line;
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
		font-size: 0.78rem;
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
		font-size: 0.85rem;
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
