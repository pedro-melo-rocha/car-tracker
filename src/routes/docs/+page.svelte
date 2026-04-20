<script lang="ts">
	import { MAKE_RELIABILITY, MAKE_RELIABILITY_NOTES, ENGINE_PROFILES } from '$lib/constants';

	const weights = [
		{ label: 'Kms', pct: 22, hint: 'Fuel-aware sweet spot: diesel 0–130k ⇒ 100, 280k ⇒ 0. Petrol 0–90k ⇒ 100, 200k ⇒ 0.' },
		{ label: 'Price', pct: 22, hint: '€0–€2500 ⇒ 100 (bargain plateau), €5000 ⇒ 50 (budget), €7500 ⇒ 0. Doesn\u2019t reward suspiciously cheap listings.' },
		{ label: 'Reliability', pct: 30, hint: 'Make baseline (60–90) ± engine adjustment. The dominant subscore — bad engines sink a cheap car.' },
		{ label: 'Year', pct: 13, hint: '2005 ⇒ 0, 2020 ⇒ 100. Rewards newer electronics & DPF maturity.' },
		{ label: 'Location', pct: 13, hint: 'Driving distance from Viana do Castelo, dampened: max 30-point penalty at 600km.' }
	];

	const sections = [
		{ id: 'weights', label: 'Weights' },
		{ id: 'subscores', label: 'Subscores' },
		{ id: 'makes', label: 'Makes' },
		{ id: 'engines', label: 'Engines' },
		{ id: 'not-scored', label: 'Not scored' },
		{ id: 'thresholds', label: 'Thresholds' },
		{ id: 'sources', label: 'Sources' }
	];

	const makes = Object.entries(MAKE_RELIABILITY)
		.filter(([k]) => k !== 'vw' && k !== 'citroen' && k !== 'mercedes-benz')
		.sort((a, b) => b[1] - a[1])
		.map(([k, v]) => ({
			name: k
				.split(' ')
				.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
				.join(' '),
			score: v,
			note: MAKE_RELIABILITY_NOTES[k] ?? null
		}));

	function makeCls(v: number) {
		return v >= 75 ? 'green' : v >= 55 ? 'yellow' : 'red';
	}

	const allEngines = ENGINE_PROFILES.map((p) => {
		const pattern = p.re.source
			.replace(/\\s\*/g, ' ')
			.replace(/\\\./g, '.')
			.replace(/\[- ?\]\??/g, '-')
			.replace(/\(\?!.*?\)/g, '')
			.replace(/\\b/g, '')
			.replace(/\(.*?\)/g, (m) =>
				m.replace(/[()|]/g, ' ').trim().split(/\s+/).join('/')
			)
			.replace(/\s+/g, ' ')
			.trim();
		return {
			pattern,
			delta: p.delta,
			reason: p.reason,
			cls: p.delta > 0 ? 'pos' : 'neg',
			sign: p.delta > 0 ? '+' : ''
		};
	});

	const posCount = allEngines.filter((e) => e.delta > 0).length;
	const negCount = allEngines.filter((e) => e.delta < 0).length;

	let engineFilter: 'all' | 'pos' | 'neg' = $state('all');
	let engineQuery = $state('');

	const visibleEngines = $derived(
		allEngines.filter((e) => {
			if (engineFilter === 'pos' && e.delta <= 0) return false;
			if (engineFilter === 'neg' && e.delta >= 0) return false;
			if (engineQuery.trim()) {
				const q = engineQuery.toLowerCase();
				return e.pattern.toLowerCase().includes(q) || e.reason.toLowerCase().includes(q);
			}
			return true;
		})
	);

	let activeSection = $state('weights');

	function handleNavClick(e: MouseEvent, id: string) {
		e.preventDefault();
		const el = document.getElementById(id);
		if (!el) return;
		activeSection = id;
		el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<div class="docs-view">
	<aside class="docs-toc" aria-label="On this page">
		<div class="toc-title">On this page</div>
		<nav>
			{#each sections as s (s.id)}
				<a
					href="#{s.id}"
					class="toc-link"
					class:active={activeSection === s.id}
					onclick={(e) => handleNavClick(e, s.id)}
				>
					{s.label}
				</a>
			{/each}
		</nav>
	</aside>

	<main class="docs-main">
		<header class="docs-header">
			<h2>Scoring Methodology</h2>
			<p class="docs-sub">
				Every car gets a 0–100 score designed to surface the most promising leads in the ≤5k€
				Portuguese used-car segment. Higher is better. The score blends objective facts (km, price,
				year, distance) with market reliability signals.
			</p>
		</header>

		<section id="weights" class="docs-section">
			<h3>Weights</h3>
			<div class="docs-weights">
				{#each weights as w (w.label)}
					<div class="docs-weight-card">
						<div class="w-top">
							<span class="w-label">{w.label}</span>
							<span class="w-value">{w.pct}%</span>
						</div>
						<div class="w-bar" aria-hidden="true">
							<div class="w-bar-fill" style="width: {(w.pct / 30) * 100}%"></div>
						</div>
						<div class="w-hint">{w.hint}</div>
					</div>
				{/each}
			</div>
		</section>

		<section id="subscores" class="docs-section">
			<h3>How each subscore works</h3>
			<details open>
				<summary><strong>Kms</strong> <span class="summary-tag">fuel-aware curve</span></summary>
				<div class="details-body">
					<svg class="curve" viewBox="0 0 320 180" role="img" aria-label="Km subscore curve">
						<!-- grid + axes -->
						<g class="grid">
							<line x1="40" y1="20" x2="40" y2="150" />
							<line x1="40" y1="150" x2="310" y2="150" />
							<line x1="40" y1="85" x2="310" y2="85" class="dashed" />
							<line x1="40" y1="20" x2="310" y2="20" class="dashed" />
						</g>
						<!-- y labels -->
						<text x="34" y="24" class="ax">100</text>
						<text x="34" y="89" class="ax">50</text>
						<text x="34" y="154" class="ax">0</text>
						<!-- x labels (0, 90, 130, 200, 280, 300k) -->
						<text x="40" y="165" class="ax mid">0</text>
						<text x="121" y="165" class="ax mid">90k</text>
						<text x="157" y="165" class="ax mid">130k</text>
						<text x="220" y="165" class="ax mid">200k</text>
						<text x="292" y="165" class="ax mid">300k</text>
						<!-- diesel curve: x=40+km/300000*270, plateau 0-130k, decay to 280k -->
						<polyline
							class="curve-line diesel"
							points="40,20 157,20 283,150 310,150"
						/>
						<!-- petrol curve -->
						<polyline
							class="curve-line petrol"
							points="40,20 121,20 220,150 310,150"
						/>
						<!-- legend -->
						<g class="legend" transform="translate(210, 30)">
							<line x1="0" y1="4" x2="16" y2="4" class="curve-line diesel" />
							<text x="20" y="8" class="ax">Diesel</text>
							<line x1="0" y1="20" x2="16" y2="20" class="curve-line petrol" />
							<text x="20" y="24" class="ax">Petrol</text>
						</g>
					</svg>
					<p>
						Diesels plateau at 100 between <code>0–130 000 km</code> and decay linearly to 0 at
						<code>280 000 km</code>. Petrol ages faster: plateau <code>0–90 000 km</code>, decay
						to 0 at <code>200 000 km</code>. Below the plateau the score stays flat — we don't
						reward suspiciously low km on an old car, since odometer rollback is a common fraud
						pattern in this segment.
					</p>
				</div>
			</details>
			<details>
				<summary><strong>Price</strong> <span class="summary-tag">3-zone piecewise</span></summary>
				<div class="details-body">
					<svg class="curve" viewBox="0 0 320 180" role="img" aria-label="Price subscore curve">
						<g class="grid">
							<line x1="40" y1="20" x2="40" y2="150" />
							<line x1="40" y1="150" x2="310" y2="150" />
							<line x1="40" y1="85" x2="310" y2="85" class="dashed" />
							<line x1="40" y1="20" x2="310" y2="20" class="dashed" />
						</g>
						<text x="34" y="24" class="ax">100</text>
						<text x="34" y="89" class="ax">50</text>
						<text x="34" y="154" class="ax">0</text>
						<!-- x axis scale: 0 to 10000 mapped to 40-310 (270px) -->
						<!-- 2500 -> 40 + 2500/10000*270 = 107.5 -->
						<!-- 5000 -> 175 -->
						<!-- 7500 -> 242.5 -->
						<!-- 10000 -> 310 -->
						<text x="40" y="165" class="ax mid">€0</text>
						<text x="107" y="165" class="ax mid">€2.5k</text>
						<text x="175" y="165" class="ax mid">€5k</text>
						<text x="242" y="165" class="ax mid">€7.5k</text>
						<text x="305" y="165" class="ax mid">€10k</text>
						<!-- budget marker -->
						<line x1="175" y1="20" x2="175" y2="150" class="marker" />
						<text x="175" y="14" class="ax mid marker-label">budget</text>
						<!-- curve: (0,100) (2500,100) (5000,50) (7500,0) (10000,0) -->
						<polyline
							class="curve-line price"
							points="40,20 107,20 175,85 242,150 310,150"
						/>
					</svg>
					<p>
						Anchored on the <code>€5000</code> budget. Plateau at 100 from
						<code>€0 to €2500</code>
						(bargain zone), linear decay to 50 at <code>€5000</code>, then a second decay to 0 at
						<code>€7500</code>. The plateau exists because suspiciously cheap listings are usually
						scams, salvage or mechanical wrecks. The soft tail past budget lets a genuine
						over-budget deal still surface through the total score.
					</p>
				</div>
			</details>
			<details>
				<summary
					><strong>Reliability</strong> <span class="summary-tag">dominant 30%</span></summary
				>
				<p>
					Each make starts from a baseline derived from community consensus. The engine pattern
					matcher then applies a bonus or penalty based on the known track record of the block.
					Without an engine signal the score falls back to the pure make baseline. In the ≤5k€
					segment a bad engine can cost more in repairs than the car itself.
				</p>
			</details>
			<details>
				<summary><strong>Year</strong> <span class="summary-tag">linear 2005–2020</span></summary>
				<p>
					2005 → 0, 2020 → 100. Newer cars tend to have better safety kit and more mature DPF/EGR
					systems, but nothing newer than 2020 usually appears in this budget.
				</p>
			</details>
			<details>
				<summary
					><strong>Location</strong> <span class="summary-tag">dampened distance</span></summary
				>
				<p>
					Straight-line driving distance from <strong>Viana do Castelo</strong>. Cars in Minho,
					Porto, Braga score near 100; the curve is dampened so the Algarve max penalty is around
					30 points — distance shouldn't bury an otherwise excellent car.
				</p>
			</details>
		</section>

		<section id="makes" class="docs-section">
			<h3>Make reliability baseline</h3>
			<p class="section-lead">Before any engine adjustment. Scale is 0–100.</p>
			<details class="context-details">
				<summary>Why these numbers differ from "most reliable brand" lists</summary>
				<p class="docs-context">
					These scores are <strong>tuned for our shopping window</strong>: roughly €5k, cars
					typically 8–15 years old, bought and driven in Portugal. New-car owner surveys (<a
						href="https://www.jdpower.com/cars/ratings/dependability"
						target="_blank"
						rel="noreferrer noopener">J.D. Power</a
					>,
					<a href="https://www.whatcar.com/reliability/" target="_blank" rel="noreferrer noopener"
						>What Car?</a
					>,
					<a
						href="https://www.reliabilityindex.com/"
						target="_blank"
						rel="noreferrer noopener">Reliability Index</a
					>) skew young — they tell you how a 2-year-old car is behaving, not a 12-year-old one.
					For the cars we actually look at, long-term durability signals matter more:
					<strong>German inspection reports</strong> —
					<a
						href="https://www.tuev-verband.de/pruefungen/tuev-report"
						target="_blank"
						rel="noreferrer noopener">TÜV Report</a
					> and
					<a
						href="https://www.dekra.com/en/used-car-report/"
						target="_blank"
						rel="noreferrer noopener">Dekra Used Car Report</a
					> — plus long-term ownership data from
					<a
						href="https://www.consumerreports.org/cars/"
						target="_blank"
						rel="noreferrer noopener">Consumer Reports</a
					> and European specialist forums. We also factor in
					<strong>parts availability and mechanic support in Portugal</strong>.
				</p>
			</details>
			<div class="docs-makes">
				{#each makes as m (m.name)}
					<div class="docs-make-row">
						<div class="m-head">
							<span class="m-name">{m.name}</span>
							<span class="m-score {makeCls(m.score)}">{m.score}</span>
						</div>
						{#if m.note}
							<p class="m-note">{m.note}</p>
						{/if}
					</div>
				{/each}
			</div>
		</section>

		<section id="engines" class="docs-section">
			<h3>Engine adjustments</h3>
			<p class="section-lead">
				The matcher scans title + notes + the engine field. First match wins, and its delta is
				added to the make baseline.
			</p>

			<div class="engine-controls">
				<div class="engine-tabs" role="tablist">
					<button
						type="button"
						role="tab"
						aria-selected={engineFilter === 'all'}
						class:active={engineFilter === 'all'}
						onclick={() => (engineFilter = 'all')}
					>
						All <span class="count">{allEngines.length}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={engineFilter === 'pos'}
						class:active={engineFilter === 'pos'}
						class:pos={true}
						onclick={() => (engineFilter = 'pos')}
					>
						Bonus <span class="count">{posCount}</span>
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={engineFilter === 'neg'}
						class:active={engineFilter === 'neg'}
						class:neg={true}
						onclick={() => (engineFilter = 'neg')}
					>
						Penalty <span class="count">{negCount}</span>
					</button>
				</div>
				<input
					type="search"
					class="engine-search"
					placeholder="Filter engines (e.g. tdi, honda, chain)…"
					bind:value={engineQuery}
				/>
			</div>

			<div class="docs-engines">
				{#each visibleEngines as e (e.pattern + e.reason)}
					<div class="docs-engine-row {e.cls}">
						<span class="docs-engine-label">{e.pattern}</span>
						<span class="docs-engine-delta">{e.sign}{e.delta}</span>
						<span class="docs-engine-reason">{e.reason}</span>
					</div>
				{:else}
					<div class="engine-empty">No engines match that filter.</div>
				{/each}
			</div>
		</section>

		<section id="not-scored" class="docs-section">
			<h3>What isn't scored</h3>
			<ul>
				<li><strong>Seller behaviour</strong> — note it in the Notes field; not a numeric input.</li>
				<li>
					<strong>Accident history / rust</strong> — impossible to assess remotely. Inspect on visit.
				</li>
				<li>
					<strong>Options/trim level</strong> — irrelevant for this budget; most listings are base/mid
					trim.
				</li>
				<li>
					<strong>FAP/DPF removal</strong> — technically adds torque and reduces failure risk, but it's
					illegal for IPO. The model ignores it.
				</li>
			</ul>
		</section>

		<section id="thresholds" class="docs-section">
			<h3>Colour thresholds</h3>
			<div class="threshold-pills">
				<span class="threshold-pill green">≥ 75 green</span>
				<span class="threshold-pill yellow">50–74 yellow</span>
				<span class="threshold-pill red">&lt; 50 red</span>
			</div>
			<p>Don't overthink a single-point gap — the model is a ranking aid, not an oracle.</p>
		</section>

		<section id="sources" class="docs-section">
			<h3>Sources &amp; further reading</h3>
			<div class="docs-sources">
				Reliability consensus is distilled from Portuguese used-car community discussions (r/AutoTuga
				threads on "carro até 5000 €"), plus editorial reviews from
				<a href="https://www.razaoautomovel.com/" target="_blank" rel="noopener noreferrer"
					>Razão Automóvel</a
				>,
				<a href="https://motorguia.net/" target="_blank" rel="noopener noreferrer">Motorguia</a>,
				<a href="https://furiamotor.com/" target="_blank" rel="noopener noreferrer">Furiamotor</a>,
				and the
				<a
					href="https://www.e-konomista.pt/motores-diesel-fiaveis/"
					target="_blank"
					rel="noopener noreferrer">E-konomista</a
				>
				diesel-reliability roundup. Engine-specific verdicts are cross-checked against owner forums
				(ibizaClubPT, alfaromeoteam, clubegolfpt).
			</div>
		</section>
	</main>
</div>

<style>
	.docs-view {
		display: grid;
		grid-template-columns: 180px minmax(0, 1fr);
		gap: 40px;
		padding: 8px 0 48px;
		align-items: start;
	}

	.docs-toc {
		position: sticky;
		top: calc(var(--header-h) + 20px);
		align-self: start;
	}
	.docs-toc .toc-title {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		font-weight: 600;
		margin-bottom: 10px;
		padding-left: 12px;
	}
	.docs-toc nav {
		display: flex;
		flex-direction: column;
		border-left: 1px solid var(--border);
	}
	.toc-link {
		display: block;
		padding: 6px 12px;
		font-size: 0.85rem;
		color: var(--text-secondary);
		text-decoration: none;
		border-left: 2px solid transparent;
		margin-left: -1px;
		transition: color var(--dur-fast) var(--ease),
			border-color var(--dur-fast) var(--ease);
	}
	.toc-link:hover {
		color: var(--text);
	}
	.toc-link.active {
		color: var(--accent);
		border-left-color: var(--accent);
		font-weight: 600;
	}

	.docs-main {
		min-width: 0;
		max-width: 820px;
	}
	.docs-header {
		padding-bottom: 20px;
		border-bottom: 1px solid var(--border);
		margin-bottom: 24px;
	}
	.docs-header h2 {
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.2;
		margin: 0 0 0.5rem 0;
	}
	.docs-sub {
		color: var(--text-secondary);
		font-size: var(--fs-md);
		line-height: 1.6;
	}

	.docs-section {
		scroll-margin-top: calc(var(--header-h) + 16px);
		margin-top: 40px;
	}
	.docs-section:first-of-type {
		margin-top: 0;
	}
	.docs-section h3 {
		font-size: 1.1rem;
		margin-bottom: 10px;
		letter-spacing: -0.01em;
	}
	.section-lead {
		color: var(--text-secondary);
		font-size: var(--fs-sm);
		line-height: 1.6;
		margin-bottom: 12px;
	}
	.docs-section p,
	.docs-section li {
		color: var(--text-secondary);
		font-size: var(--fs-sm);
		line-height: 1.6;
	}
	.docs-section p {
		margin-bottom: 10px;
	}
	.docs-section ul {
		list-style: none;
		padding: 0;
		margin: 6px 0 10px;
	}
	.docs-section li {
		padding: 8px 0;
		border-bottom: 1px solid var(--border);
	}
	.docs-section li:last-child {
		border-bottom: none;
	}
	.docs-section strong {
		color: var(--text);
		font-weight: 700;
	}
	.docs-section code {
		font-family: var(--mono);
		font-size: 0.82rem;
		background: var(--bg-warm);
		padding: 1px 6px;
		border-radius: 4px;
		color: var(--text);
	}

	.docs-weights {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 10px;
	}
	.docs-weight-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 12px 14px;
	}
	.docs-weight-card .w-top {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 8px;
	}
	.docs-weight-card .w-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text);
		letter-spacing: -0.01em;
	}
	.docs-weight-card .w-value {
		font-family: var(--mono);
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--accent);
	}
	.docs-weight-card .w-bar {
		height: 4px;
		background: var(--bg-warm);
		border-radius: 2px;
		overflow: hidden;
		margin-bottom: 10px;
	}
	.docs-weight-card .w-bar-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 2px;
	}
	.docs-weight-card .w-hint {
		font-size: 0.78rem;
		color: var(--text-muted);
		line-height: 1.4;
	}

	details {
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-card);
		margin-bottom: 8px;
		overflow: hidden;
	}
	details summary {
		list-style: none;
		cursor: pointer;
		padding: 12px 14px;
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.9rem;
		color: var(--text);
		user-select: none;
		position: relative;
	}
	details summary::-webkit-details-marker {
		display: none;
	}
	details summary::after {
		content: '+';
		margin-left: auto;
		font-family: var(--mono);
		font-size: 1rem;
		color: var(--text-muted);
		transition: transform var(--dur-fast) var(--ease);
	}
	details[open] summary::after {
		content: '−';
	}
	details summary strong {
		font-weight: 700;
	}
	.summary-tag {
		font-size: 0.72rem;
		color: var(--text-muted);
		background: var(--bg-warm);
		padding: 2px 8px;
		border-radius: 999px;
		font-weight: 500;
	}
	details > p {
		padding: 0 14px 14px;
		margin: 0;
	}
	.details-body {
		padding: 0 14px 14px;
	}
	.details-body p {
		margin: 0;
		color: var(--text-secondary);
		font-size: var(--fs-sm);
		line-height: 1.6;
	}
	.curve {
		display: block;
		width: 100%;
		max-width: 420px;
		height: auto;
		margin: 4px 0 14px;
		background: var(--bg-warm);
		border-radius: var(--radius-sm);
		padding: 4px;
	}
	.curve .grid line {
		stroke: var(--border-strong);
		stroke-width: 1;
	}
	.curve .grid line.dashed {
		stroke: var(--border);
		stroke-dasharray: 2 3;
	}
	.curve .ax {
		font-family: var(--mono);
		font-size: 8px;
		fill: var(--text-muted);
	}
	.curve .ax.mid {
		text-anchor: middle;
	}
	.curve .curve-line {
		fill: none;
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.curve .curve-line.diesel {
		stroke: var(--accent);
	}
	.curve .curve-line.petrol {
		stroke: var(--warn);
	}
	.curve .curve-line.price {
		stroke: var(--accent);
	}
	.curve .marker {
		stroke: var(--red);
		stroke-width: 1;
		stroke-dasharray: 2 2;
		opacity: 0.6;
	}
	.curve .marker-label {
		fill: var(--red);
		font-size: 7px;
	}
	details.context-details {
		margin-bottom: 16px;
	}
	details.context-details > .docs-context {
		padding: 0 14px 14px;
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.55;
	}
	.docs-context a {
		color: var(--accent);
		text-decoration: none;
	}
	.docs-context a:hover {
		text-decoration: underline;
	}

	.engine-controls {
		display: flex;
		gap: 10px;
		margin-bottom: 12px;
		flex-wrap: wrap;
	}
	.engine-tabs {
		display: inline-flex;
		background: var(--bg-warm);
		padding: 3px;
		border-radius: var(--radius-md);
		gap: 2px;
	}
	.engine-tabs button {
		background: transparent;
		border: none;
		padding: 6px 12px;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-secondary);
		border-radius: var(--radius-sm);
		display: inline-flex;
		align-items: center;
		gap: 6px;
		transition: background var(--dur-fast) var(--ease),
			color var(--dur-fast) var(--ease);
	}
	.engine-tabs button:hover {
		color: var(--text);
	}
	.engine-tabs button.active {
		background: var(--bg-card);
		color: var(--text);
		box-shadow: var(--shadow-sm);
	}
	.engine-tabs button.active.pos {
		color: var(--green);
	}
	.engine-tabs button.active.neg {
		color: var(--red);
	}
	.engine-tabs .count {
		font-family: var(--mono);
		font-size: 0.72rem;
		background: var(--bg-warm);
		padding: 1px 6px;
		border-radius: 999px;
		color: var(--text-muted);
	}
	.engine-tabs button.active .count {
		background: var(--bg-warm);
	}
	.engine-search {
		flex: 1;
		min-width: 200px;
		padding: 7px 12px;
		font-size: 0.85rem;
		font-family: inherit;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		color: var(--text);
		outline: none;
		transition: border-color var(--dur-fast) var(--ease);
	}
	.engine-search:focus {
		border-color: var(--accent);
	}

	.docs-engines {
		display: grid;
		gap: 6px;
	}
	.docs-engine-row {
		display: grid;
		grid-template-columns: minmax(140px, 1fr) 60px 2fr;
		gap: 10px;
		align-items: center;
		padding: 8px 12px;
		border-radius: var(--radius-md);
		border: 1px solid transparent;
	}
	.docs-engine-row.pos {
		background: var(--green-bg);
	}
	.docs-engine-row.neg {
		background: var(--red-bg);
	}
	.docs-engine-label {
		font-family: var(--mono);
		font-weight: 600;
		color: var(--text);
		font-size: 0.82rem;
	}
	.docs-engine-delta {
		font-family: var(--mono);
		font-size: 0.95rem;
		font-weight: 700;
		text-align: center;
	}
	.docs-engine-row.pos .docs-engine-delta {
		color: var(--green);
	}
	.docs-engine-row.neg .docs-engine-delta {
		color: var(--red);
	}
	.docs-engine-reason {
		color: var(--text-secondary);
		font-size: 0.82rem;
		line-height: 1.4;
	}
	.engine-empty {
		text-align: center;
		padding: 24px;
		color: var(--text-muted);
		font-size: 0.85rem;
		background: var(--bg-warm);
		border-radius: var(--radius-md);
	}

	.docs-makes {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 8px;
	}
	.docs-make-row {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px 12px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}
	.docs-make-row .m-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.docs-make-row .m-note {
		margin: 0;
		font-size: 0.78rem;
		line-height: 1.4;
		color: var(--text-muted);
	}
	.docs-make-row .m-name {
		color: var(--text);
		font-weight: 600;
	}
	.docs-make-row .m-score {
		font-family: var(--mono);
		font-weight: 700;
	}
	.docs-make-row .m-score.green {
		color: var(--green);
	}
	.docs-make-row .m-score.yellow {
		color: var(--yellow);
	}
	.docs-make-row .m-score.red {
		color: var(--red);
	}

	.threshold-pills {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-bottom: 10px;
	}
	.threshold-pill {
		font-family: var(--mono);
		font-size: 0.8rem;
		font-weight: 600;
		padding: 4px 10px;
		border-radius: 999px;
	}
	.threshold-pill.green {
		background: var(--green-bg);
		color: var(--green);
	}
	.threshold-pill.yellow {
		background: var(--yellow-bg);
		color: var(--yellow);
	}
	.threshold-pill.red {
		background: var(--red-bg);
		color: var(--red);
	}

	.docs-sources {
		font-size: 0.82rem;
		color: var(--text-muted);
		line-height: 1.7;
		padding: 14px 16px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}
	.docs-sources a {
		color: var(--accent);
		text-decoration: none;
	}
	.docs-sources a:hover {
		text-decoration: underline;
	}

	@media (max-width: 900px) {
		.docs-view {
			grid-template-columns: 1fr;
			gap: 0;
		}
		.docs-toc {
			display: none;
		}
		.docs-weights {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 640px) {
		.docs-view {
			padding: 24px 20px 60px;
		}
		.docs-engine-row {
			grid-template-columns: 1fr auto;
		}
		.docs-engine-reason {
			grid-column: 1 / -1;
		}
	}
</style>
