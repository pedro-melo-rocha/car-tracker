<script lang="ts">
	import { onMount, tick } from 'svelte';
	import type { Car } from '$lib/types';
	import { STATUSES, STATUS_LABELS, type CarStatus } from '$lib/types';
	import { computeScore, computeScoreBreakdown, detectScamRisk, locationKm } from '$lib/scoring';
	import { FLAG_QUESTIONS } from '$lib/scoring/questions';
	import { netPriceDrop } from '$lib/price';
	import { SCORE_WEIGHTS } from '$lib/constants';
	import PriceHistoryTimeline from './PriceHistoryTimeline.svelte';
	import ScoreBadge from '$components/ui/ScoreBadge.svelte';
	import { cars, deleteCar as removeCar, updateCar } from '$lib/stores/cars';
	import { confirmDialog, dialog, toast } from '$lib/stores/ui';
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

	const DAY = 86_400_000;

	const score = $derived(computeScore(car));
	const breakdown = $derived(computeScoreBreakdown(car));
	const scam = $derived(detectScamRisk(car, { peers: $cars }));
	const distance = $derived(locationKm(car.location));
	const daysListed = $derived(
		car.listedAt ? Math.max(0, Math.floor((Date.now() - Date.parse(car.listedAt)) / DAY)) : null
	);
	const priceDrop = $derived(netPriceDrop(car.priceHistory));
	const inCompare = $derived($compareIds.includes(car.id));
	const staleIn = $derived(daysUntilStale(car));
	const contactedOn = $derived(
		car.contactedAt
			? new Date(car.contactedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
			: null
	);

	// Seller facts that bear on trust, in plain words. Risky ones get a warning tone.
	const sellerFacts = $derived.by(() => {
		const out: { text: string; risky: boolean }[] = [];
		if (car.sellerType) {
			const who = car.sellerType === 'dealer' ? 'Dealer' : 'Private seller';
			out.push({
				text: car.sellerSince ? `${who}, on the site since ${car.sellerSince}` : who,
				risky: scam.flags.some((f) => f.id === 'new-account' || f.id === 'new-account-cheap')
			});
		}
		if (car.imported != null) out.push({ text: car.imported ? 'Imported' : 'Not imported', risky: !!car.imported });
		if (car.owners != null) out.push({ text: `${car.owners} ${car.owners === 1 ? 'owner' : 'owners'}`, risky: car.owners >= 4 });
		if (car.warrantyMonths) out.push({ text: `${car.warrantyMonths}-month warranty`, risky: false });
		if (car.photoCount != null)
			out.push({ text: `${car.photoCount} ${car.photoCount === 1 ? 'photo' : 'photos'}`, risky: car.photoCount <= 4 });
		return out;
	});

	const details = $derived(
		[
			{ k: 'Engine', v: [car.engine, car.power ? `${car.power} cv` : ''].filter(Boolean).join(', ') },
			{ k: 'Gearbox', v: car.gearbox ?? '' },
			{
				k: 'Location',
				v: car.location ? (distance != null ? `${car.location}, ${distance} km from Viana` : car.location) : ''
			}
		].filter((d) => d.v)
	);

	// Status: one obvious next step; the rest live in the "More" menu.
	const NEXT: Record<CarStatus, { to: CarStatus; label: string } | null> = {
		'to-contact': { to: 'contacted', label: 'Mark as contacted' },
		contacted: { to: 'negotiating', label: 'Start negotiating' },
		negotiating: { to: 'final-offer', label: 'Mark final offer' },
		'final-offer': null,
		dismissed: { to: 'to-contact', label: 'Reopen' }
	};
	const next = $derived(NEXT[car.status]);

	// "What if": try another price or km. Nothing is saved.
	let simOpen = $state(false);
	let simPrice = $state<number | null>(null);
	let simKm = $state<number | null>(null);
	const simCar = $derived({ ...car, price: simPrice ?? car.price, km: simKm ?? car.km });
	const simulating = $derived(
		simOpen && ((simPrice != null && simPrice !== car.price) || (simKm != null && simKm !== car.km))
	);
	const simScore = $derived(computeScore(simCar));
	const shown = $derived(simulating ? computeScoreBreakdown(simCar) : breakdown);
	const rows = $derived([
		{ key: 'km', label: 'Km', now: shown.km, was: breakdown.km },
		{ key: 'price', label: 'Price', now: shown.price, was: breakdown.price },
		{ key: 'rel', label: 'Reliability', now: shown.rel.score, was: breakdown.rel.score },
		{ key: 'year', label: 'Year', now: shown.year, was: breakdown.year },
		{ key: 'loc', label: 'Location', now: shown.loc, was: breakdown.loc }
	]);
	const weightsLine = `Weights: km ${pct(SCORE_WEIGHTS.km)}, price ${pct(SCORE_WEIGHTS.price)}, reliability ${pct(SCORE_WEIGHTS.reliability)}, year ${pct(SCORE_WEIGHTS.year)}, location ${pct(SCORE_WEIGHTS.location)}.`;

	function pct(w: number) {
		return Math.round(w * 100) + '%';
	}
	function barCls(v: number) {
		return v >= 70 ? 'good' : v >= 50 ? 'warn' : 'bad';
	}

	let reasonOpen = $state(false);
	let menuOpen = $state(false);
	let pendingStatus: CarStatus | null = $state(null);

	async function setStatus(to: CarStatus, undoable = true) {
		menuOpen = false;
		if (car.status === to || pendingStatus !== null) return;
		const previous = car.status;
		pendingStatus = to;
		try {
			await updateCar(car.id, { status: to });
			if (undoable) {
				toast.action(
					`Moved to ${STATUS_LABELS[to]}`,
					{ label: 'Undo', onClick: () => void setStatus(previous, false) },
					6000,
					'success'
				);
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Couldn’t change the status');
		} finally {
			pendingStatus = null;
		}
	}

	async function onShare() {
		menuOpen = false;
		const url = `${location.origin}/share/${car.id}`;
		try {
			await navigator.clipboard.writeText(url);
			toast.success('Share link copied');
		} catch {
			toast.info(url);
		}
	}

	async function onDelete() {
		menuOpen = false;
		const ok = await confirmDialog({
			title: 'Delete this car?',
			message: `“${car.title}” will be removed from the list for both of you.`,
			confirmLabel: 'Delete'
		});
		if (!ok) return;
		await removeCar(car.id);
		onclose();
	}

	// Focus: move into the panel on open, keep Tab inside it, give focus back on close.
	let panel: HTMLDivElement | undefined = $state();
	let titleEl: HTMLHeadingElement | undefined = $state();
	let menuWrap: HTMLDivElement | undefined = $state();

	onMount(() => {
		const opener = document.activeElement as HTMLElement | null;
		tick().then(() => titleEl?.focus());
		return () => {
			if (opener && document.contains(opener)) opener.focus();
		};
	});

	function focusables(): HTMLElement[] {
		if (!panel) return [];
		return [
			...panel.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
			)
		].filter((el) => el.offsetParent !== null);
	}

	function onKeydown(e: KeyboardEvent) {
		if ($dialog) return; // the delete confirmation owns the keyboard
		const t = e.target as HTMLElement;
		const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;

		if (e.key === 'Escape') {
			e.preventDefault();
			if (menuOpen) menuOpen = false;
			else if (typing) panel?.focus(); // leave the field, stay in the panel
			else onclose();
			return;
		}
		if (e.key === 'Tab') {
			const list = focusables();
			if (!list.length) return;
			const first = list[0];
			const last = list[list.length - 1];
			if (e.shiftKey && (document.activeElement === first || document.activeElement === titleEl)) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
			return;
		}
		if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
		const idx = Number(e.key) - 1;
		if (Number.isInteger(idx) && idx >= 0 && idx < STATUSES.length) {
			e.preventDefault();
			void setStatus(STATUSES[idx]);
		}
	}

	function onDocClick(e: MouseEvent) {
		if (menuOpen && menuWrap && !menuWrap.contains(e.target as Node)) menuOpen = false;
	}
	$effect(() => {
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	});
</script>

<div class="detail-overlay" onclick={onclose} role="presentation"></div>
<div
	class="detail-panel"
	role="dialog"
	aria-modal="true"
	aria-labelledby="detail-title"
	tabindex="-1"
	bind:this={panel}
	onkeydown={onKeydown}
>
	<div class="content">
		<div class="head">
			<div class="source">
				{car.source ?? 'Unknown source'}{#if daysListed != null}<span class="dot-sep">·</span>listed {daysListed}
					{daysListed === 1 ? 'day' : 'days'} ago{/if}
			</div>
			<button type="button" class="close-btn" onclick={onclose} aria-label="Close">
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
					<path d="M4 4l8 8M12 4l-8 8" />
				</svg>
			</button>
		</div>

		<h1 class="title" id="detail-title" tabindex="-1" bind:this={titleEl}>{car.title}</h1>

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
			<ScoreBadge score={simulating ? simScore : score} size="lg" />
			<div>
				<div class="price-line">{car.price ? '€' + car.price.toLocaleString('pt-PT') : 'No price'}</div>
				<div class="facts-line">
					{car.km ? car.km.toLocaleString('pt-PT') + ' km' : 'km unknown'}
					<span class="dot-sep">·</span>{car.year ?? 'year unknown'}
					<span class="dot-sep">·</span>{car.fuel ?? 'fuel unknown'}
				</div>
				{#if priceDrop > 0}
					<div class="drop-note">Down €{priceDrop.toLocaleString('pt-PT')} since first seen</div>
				{/if}
				{#if simulating}
					<div class="sim-note">Simulated score, was {score}</div>
				{/if}
			</div>
		</div>

		<section class="section call" class:high={scam.level === 'high'} aria-labelledby="call-h">
			<h2 id="call-h">
				{scam.level === 'high' ? 'Likely scam. Before you call' : 'Before you call'}
			</h2>
			{#if scam.flags.length}
				<ul class="flags">
					{#each scam.flags as f (f.id)}
						<li>
							<span class="flag-label">{f.label}</span>
							<span class="flag-ask">{FLAG_QUESTIONS[f.id]}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="no-flags">No red flags in the listing.</p>
			{/if}
			{#if sellerFacts.length}
				<ul class="seller-facts" aria-label="Seller and listing">
					{#each sellerFacts as s (s.text)}
						<li class:risky={s.risky}>{s.text}</li>
					{/each}
				</ul>
			{/if}
			<div class="your-notes">
				<h3>Your notes</h3>
				{#if car.notes}
					<p>{car.notes}</p>
				{:else}
					<button type="button" class="text-btn" onclick={() => onedit(car.id)}>Add a note</button>
				{/if}
			</div>
		</section>

		<section class="section" aria-labelledby="score-h">
			<div class="section-head">
				<h2 id="score-h">Score breakdown</h2>
				<a href="/docs" class="text-link">How the score works</a>
			</div>
			<p class="legend">{weightsLine}</p>
			<div class="breakdown">
				{#each rows as r (r.key)}
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
						<span class="br-value">
							{#if simulating && r.now !== r.was}<span class="was">{r.was} →</span>{/if}
							{r.now}
						</span>
						<span class="br-bar">
							<span class="br-fill {barCls(r.now)}" style="width:{r.now}%"></span>
							{#if simulating && r.now !== r.was}
								<span class="br-ghost" style="left:{r.was}%" aria-hidden="true"></span>
							{/if}
						</span>
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
								No engine profile matched, so this uses the make’s baseline ({shown.rel.base}). A more
								precise engine name gives a more specific score.
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
						<input type="number" inputmode="numeric" min="0" step="100" bind:value={simPrice} />
					</label>
					<label>
						<span>Km</span>
						<input type="number" inputmode="numeric" min="0" step="1000" bind:value={simKm} />
					</label>
				</div>
				<p class="sim-result" aria-live="polite">
					{#if simulating}
						Score would be <strong>{simScore}</strong>
						({simScore - score >= 0 ? '+' : ''}{simScore - score} from {score}). Nothing is saved.
					{:else}
						Now €{car.price?.toLocaleString('pt-PT') ?? '–'} and {car.km?.toLocaleString('pt-PT') ?? '–'} km.
						Type other values to see the score. Nothing is saved.
					{/if}
				</p>
			</details>
		</section>

		{#if details.length}
			<section class="section" aria-labelledby="details-h">
				<h2 id="details-h">Car details</h2>
				<dl class="details">
					{#each details as d (d.k)}
						<dt>{d.k}</dt>
						<dd>{d.v}</dd>
					{/each}
				</dl>
			</section>
		{/if}

		{#if car.description}
			<details class="description">
				<summary>Seller’s description</summary>
				<p>{car.description}</p>
			</details>
		{/if}

		{#if (car.priceHistory?.length ?? 0) > 1}
			<section class="section" aria-labelledby="history-h">
				<h2 id="history-h">Price history</h2>
				<PriceHistoryTimeline history={car.priceHistory} />
			</section>
		{/if}

		<section class="section" aria-labelledby="status-h">
			<h2 id="status-h">Status</h2>
			<p class="status-line">
				<strong>{STATUS_LABELS[car.status]}</strong>{#if car.status === 'contacted' && contactedOn}
					on {contactedOn}{/if}.
				{#if staleIn != null}
					{staleIn === 0
						? 'No reply for 3 days, so it moves to Dismissed now.'
						: `Moves to Dismissed in ${staleIn} ${staleIn === 1 ? 'day' : 'days'} unless you update it.`}
				{/if}
			</p>
			<p class="hint">Keys 1 to 5 set the status while this panel is open.</p>
		</section>
	</div>

	<div class="action-bar">
		{#if next}
			<button
				type="button"
				class="btn primary"
				disabled={pendingStatus !== null}
				onclick={() => setStatus(next.to)}
			>
				{next.label}
			</button>
		{/if}
		{#if car.url}
			<a href={car.url} target="_blank" rel="noopener noreferrer" class="btn secondary">
				<span class="wide-only">Open</span> listing
				<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
					<path d="M6 3H3v10h10v-3M9 1h6v6M7 9L15 1" />
				</svg>
			</a>
		{/if}
		<div class="menu-wrap" bind:this={menuWrap}>
			<button
				type="button"
				class="btn secondary more"
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
			>
				More
			</button>
			{#if menuOpen}
				<div class="menu" role="menu" aria-label="More actions">
					<button type="button" role="menuitem" onclick={() => { menuOpen = false; onedit(car.id); }}>Edit car</button>
					<button type="button" role="menuitem" onclick={() => { menuOpen = false; toggleCompare(car.id); }}>
						{inCompare ? 'Remove from compare' : 'Add to compare'}
					</button>
					<button type="button" role="menuitem" onclick={onShare}>Copy share link</button>
					<div class="menu-sep" role="separator"></div>
					<div class="menu-label">Move to</div>
					{#each STATUSES as s, i (s)}
						{#if s !== car.status}
							<button type="button" role="menuitem" onclick={() => setStatus(s)}>
								{STATUS_LABELS[s]}<kbd>{i + 1}</kbd>
							</button>
						{/if}
					{/each}
					<div class="menu-sep" role="separator"></div>
					<button type="button" role="menuitem" class="danger" onclick={onDelete}>Delete car</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.detail-overlay {
		position: fixed;
		inset: 0;
		background: var(--bg-overlay);
		z-index: 60;
		animation: fadeIn var(--dur) var(--ease);
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
		display: flex;
		flex-direction: column;
		outline: none;
		animation: panelIn 220ms var(--ease);
	}
	@keyframes panelIn {
		from {
			transform: translateX(24px);
		}
		to {
			transform: none;
		}
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.content {
		flex: 1;
		padding: 20px 28px 28px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-right: -10px;
	}
	.source {
		font-size: 0.85rem;
		color: var(--ink-soft);
	}
	.dot-sep {
		color: var(--ink-dim);
		margin: 0 6px;
	}
	.close-btn {
		background: transparent;
		border: 0;
		width: 44px;
		height: 44px;
		border-radius: 10px;
		color: var(--ink-soft);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.close-btn:hover {
		background: var(--card-2);
		color: var(--ink);
	}
	.close-btn svg {
		width: 16px;
		height: 16px;
	}
	.title {
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.2;
		text-wrap: balance;
		outline: none;
	}
	.title:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
		border-radius: 4px;
	}
	.hero-img {
		width: 100%;
		max-height: 240px;
		object-fit: cover;
		border-radius: 12px;
		background: var(--card-2);
	}
	.price-block {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.price-line {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}
	.facts-line {
		font-size: 0.9rem;
		color: var(--ink-soft);
		margin-top: 2px;
		font-variant-numeric: tabular-nums;
	}
	.drop-note {
		margin-top: 4px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--good);
	}
	.sim-note {
		margin-top: 4px;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--accent-hover);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding-top: 18px;
		border-top: 1px solid var(--rule);
	}
	h2 {
		font-size: 1rem;
		font-weight: 650;
		letter-spacing: -0.01em;
		color: var(--ink);
	}
	h3 {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--ink-soft);
	}
	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}

	/* Before you call */
	.call {
		background: var(--card-2);
		border: 0;
		border-radius: 12px;
		padding: 16px;
	}
	.call.high {
		background: var(--bad-bg);
	}
	.call.high h2 {
		color: var(--bad);
	}
	.flags {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.flags li {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-left: 14px;
		position: relative;
	}
	.flags li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55em;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--warn);
	}
	.call.high .flags li::before {
		background: var(--bad);
	}
	.flag-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--ink);
	}
	.flag-ask {
		font-size: 0.85rem;
		line-height: 1.45;
		color: var(--ink-soft);
	}
	.no-flags {
		font-size: 0.9rem;
		color: var(--ink-soft);
	}
	.seller-facts {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 4px 14px;
		font-size: 0.85rem;
		color: var(--ink);
	}
	.seller-facts li.risky {
		color: var(--status-negotiating-fg);
		font-weight: 600;
	}
	.your-notes {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-top: 10px;
		border-top: 1px solid var(--rule);
	}
	.your-notes p {
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--ink);
		white-space: pre-wrap;
	}
	.text-btn {
		align-self: flex-start;
		background: transparent;
		border: 0;
		padding: 0;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--accent-hover);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.text-link {
		font-size: 0.85rem;
		color: var(--accent-hover);
	}

	/* Score breakdown */
	.legend {
		font-size: 0.8rem;
		color: var(--ink-soft);
		line-height: 1.45;
	}
	.breakdown {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.br-row {
		display: grid;
		grid-template-columns: 1fr auto;
		column-gap: 10px;
		row-gap: 5px;
		align-items: center;
	}
	.br-label {
		font-size: 0.88rem;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
	}
	.br-value {
		font-size: 0.92rem;
		font-weight: 650;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
	.was {
		font-weight: 500;
		color: var(--ink-soft);
		margin-right: 2px;
	}
	.br-bar {
		grid-column: 1 / -1;
		height: 5px;
		background: var(--card-2);
		border-radius: 3px;
		position: relative;
	}
	.br-fill {
		position: absolute;
		inset: 0 auto 0 0;
		border-radius: 3px;
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
	.br-ghost {
		position: absolute;
		top: -3px;
		bottom: -3px;
		width: 2px;
		margin-left: -1px;
		background: var(--ink);
		opacity: 0.45;
	}
	.reason-tip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		margin-left: 6px;
		padding: 0;
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: 50%;
		color: var(--ink-soft);
		font-size: 0.78rem;
		font-weight: 700;
	}
	.reason-tip:hover,
	.reason-tip[aria-expanded='true'] {
		border-color: var(--accent);
		color: var(--accent-hover);
	}
	.reason-tip.warn {
		border-color: var(--warn);
		color: var(--warn);
	}
	.br-reason {
		font-size: 0.85rem;
		line-height: 1.45;
		padding: 8px 10px;
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
	.what-if {
		margin-top: 4px;
	}
	.what-if summary,
	.description summary {
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--ink);
		padding: 6px 0;
	}
	.sim-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-top: 8px;
	}
	.sim-fields label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 0.82rem;
		color: var(--ink-soft);
	}
	.sim-fields input {
		padding: 9px 10px;
		border: 1px solid var(--rule);
		border-radius: 8px;
		background: var(--card);
		font-size: 0.92rem;
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}
	.sim-fields input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.sim-result {
		margin-top: 8px;
		font-size: 0.85rem;
		line-height: 1.45;
		color: var(--ink-soft);
	}
	.sim-result strong {
		color: var(--ink);
	}

	/* Details */
	.details {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 8px 18px;
		font-size: 0.9rem;
	}
	.details dt {
		color: var(--ink-soft);
	}
	.details dd {
		margin: 0;
		color: var(--ink);
	}
	.description {
		border-top: 1px solid var(--rule);
		padding-top: 12px;
	}
	.description p {
		margin-top: 8px;
		font-size: 0.88rem;
		line-height: 1.55;
		white-space: pre-line;
	}
	.status-line {
		font-size: 0.9rem;
		line-height: 1.5;
	}
	.hint {
		font-size: 0.8rem;
		color: var(--ink-soft);
	}

	/* Sticky actions */
	.action-bar {
		position: sticky;
		bottom: 0;
		display: flex;
		gap: 8px;
		padding: 12px 28px calc(12px + env(safe-area-inset-bottom));
		background: var(--card);
		border-top: 1px solid var(--rule);
	}
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-height: 44px;
		padding: 0 16px;
		border-radius: 10px;
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
		border: 1px solid transparent;
		white-space: nowrap;
	}
	.btn.primary {
		flex: 1;
		background: var(--accent);
		color: #fff;
	}
	.btn.primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}
	.btn.primary:disabled {
		opacity: 0.6;
		cursor: wait;
	}
	.btn.secondary {
		background: var(--card);
		color: var(--ink);
		border-color: var(--border-strong);
	}
	.btn.secondary:hover {
		background: var(--card-2);
	}
	.menu-wrap {
		position: relative;
		margin-left: auto;
	}
	.menu {
		position: absolute;
		right: 0;
		bottom: calc(100% + 6px);
		min-width: 220px;
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: 12px;
		box-shadow: var(--shadow-xl);
		padding: 6px;
		display: flex;
		flex-direction: column;
	}
	.menu button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 40px;
		padding: 0 10px;
		background: transparent;
		border: 0;
		border-radius: 8px;
		text-align: left;
		font-size: 0.9rem;
		color: var(--ink);
	}
	.menu button:hover {
		background: var(--card-2);
	}
	.menu button.danger {
		color: var(--bad);
	}
	.menu button.danger:hover {
		background: var(--bad-bg);
	}
	.menu-sep {
		height: 1px;
		background: var(--rule);
		margin: 4px 0;
	}
	.menu-label {
		font-size: 0.78rem;
		color: var(--ink-soft);
		padding: 6px 10px 2px;
	}
	kbd {
		font-family: var(--font);
		font-size: 0.75rem;
		color: var(--ink-soft);
		border: 1px solid var(--rule);
		border-radius: 4px;
		padding: 0 5px;
		min-width: 20px;
		text-align: center;
	}

	@media (max-width: 640px) {
		.content {
			padding: 12px 16px 20px;
		}
		.action-bar {
			padding-left: 16px;
			padding-right: 16px;
		}
		.hero-img {
			max-height: 180px;
		}
		.title {
			font-size: 1.35rem;
		}
		.hint,
		.wide-only {
			display: none;
		}
		.action-bar {
			gap: 6px;
		}
		.btn {
			padding: 0 12px;
		}
		.btn.primary {
			min-width: 0;
		}
	}
</style>
