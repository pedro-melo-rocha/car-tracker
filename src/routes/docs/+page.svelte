<script lang="ts">
	import { MAKE_RELIABILITY, ENGINE_PROFILES } from '$lib/constants';

	const weights = [
		{ label: 'Kms', pct: 22, hint: 'Fuel-aware sweet spot: diesel 0–130k ⇒ 100, 280k ⇒ 0. Petrol 0–90k ⇒ 100, 200k ⇒ 0.' },
		{ label: 'Price', pct: 22, hint: '€0–€2500 ⇒ 100 (bargain plateau), €5000 ⇒ 50 (budget), €7500 ⇒ 0. Doesn\u2019t reward suspiciously cheap listings.' },
		{ label: 'Reliability', pct: 30, hint: 'Make baseline (60–90) ± engine adjustment. The dominant subscore — bad engines sink a cheap car.' },
		{ label: 'Year', pct: 13, hint: '2005 ⇒ 0, 2020 ⇒ 100. Rewards newer electronics & DPF maturity.' },
		{ label: 'Location', pct: 13, hint: 'Driving distance from Viana do Castelo, dampened: max 30-point penalty at 600km.' }
	];

	const makes = Object.entries(MAKE_RELIABILITY)
		.filter(([k]) => k !== 'vw' && k !== 'citroen')
		.sort((a, b) => b[1] - a[1])
		.map(([k, v]) => ({
			name: k
				.split(' ')
				.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
				.join(' '),
			score: v
		}));

	function makeCls(v: number) {
		return v >= 75 ? 'green' : v >= 55 ? 'yellow' : 'red';
	}

	const engines = ENGINE_PROFILES.map((p) => {
		const pattern = p.re.source
			.replace(/\\s\*/g, ' ')
			.replace(/\\\./g, '.')
			.replace(/\[- ?\]\??/g, '-')
			.replace(/\(\?!.*?\)/g, '')
			.replace(/\\b/g, '')
			.replace(/\(.*?\)/g, (m) =>
				m.replace(/[()|]/g, ' ').trim().split(/\s+/).slice(0, 2).join('/')
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
</script>

<div class="docs-view">
	<h2>Scoring Methodology</h2>
	<p class="docs-sub">
		Every car gets a 0–100 score designed to surface the most promising leads in the ≤5k€
		Portuguese used-car segment. Higher is better. The score blends objective facts (km, price,
		year, distance) with market reliability signals drawn from r/AutoTuga, Motorguia, Razão
		Automóvel and Furiamotor consensus.
	</p>

	<div class="docs-section">
		<h3>Weights</h3>
		<div class="docs-weights">
			{#each weights as w (w.label)}
				<div class="docs-weight-card">
					<div class="w-top">
						<span class="w-label">{w.label}</span>
						<span class="w-value">{w.pct}%</span>
					</div>
					<div class="w-hint">{w.hint}</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="docs-section">
		<h3>How each subscore works</h3>
		<p>
			<strong>Kms.</strong> A fuel-aware sweet-spot curve. Diesels plateau at 100 between
			<code>0–130 000 km</code> and decay linearly to 0 at <code>280 000 km</code> (practical end
			of life). Petrol ages faster: plateau <code>0–90 000 km</code>, decay to 0 at
			<code>200 000 km</code>. Below the plateau the score stays flat — we don't reward
			suspiciously low km on an old car, since odometer rollback is a common fraud pattern in this
			segment.
		</p>
		<p>
			<strong>Price.</strong> Three-zone piecewise curve anchored on the <code>€5000</code> budget.
			Plateau at 100 from <code>€0 to €2500</code> (bargain zone), linear decay to 50 at
			<code>€5000</code> (within budget), then a second decay to 0 at <code>€7500</code>
			(over budget but still rankable). The plateau exists because suspiciously cheap listings
			are usually scams, salvage, or mechanical wrecks — not bargains — so we don't award extra
			points for being cheaper than the realistic-bargain line. The soft tail past budget lets a
			genuine over-budget deal still surface through the total score.
		</p>
		<p>
			<strong>Reliability.</strong> Each make starts from a baseline (see table below) derived
			from consistent community consensus. The engine pattern matcher then applies a bonus or
			penalty based on the known track record of the block. Without an engine signal the score
			falls back to the pure make baseline. This carries the heaviest weight (30%) because in the
			≤5k€ segment, a bad engine can cost more in repairs than the car itself.
		</p>
		<p>
			<strong>Year.</strong> 2005 → 0, 2020 → 100. Newer cars tend to have better safety kit and
			more mature DPF/EGR systems, but nothing newer than 2020 usually appears in this budget.
		</p>
		<p>
			<strong>Location.</strong> Straight-line driving distance from
			<strong>Viana do Castelo</strong>. Cars in Minho, Porto, Braga score near 100; the curve is
			dampened so the Algarve max penalty is around 30 points — distance shouldn't bury an
			otherwise excellent car.
		</p>
	</div>

	<div class="docs-section">
		<h3>Make reliability baseline</h3>
		<p>Before any engine adjustment. Scale is 0–100.</p>
		<div class="docs-makes">
			{#each makes as m (m.name)}
				<div class="docs-make-row">
					<span class="m-name">{m.name}</span>
					<span class="m-score {makeCls(m.score)}">{m.score}</span>
				</div>
			{/each}
		</div>
	</div>

	<div class="docs-section">
		<h3>Engine adjustments</h3>
		<p>
			The matcher scans title + notes + the explicit engine field. First match wins, and its
			delta is added to the make baseline.
		</p>
		<div class="docs-engines">
			{#each engines as e (e.pattern + e.reason)}
				<div class="docs-engine-row {e.cls}">
					<span class="docs-engine-label">{e.pattern}</span>
					<span class="docs-engine-delta">{e.sign}{e.delta}</span>
					<span class="docs-engine-reason">{e.reason}</span>
				</div>
			{/each}
		</div>
	</div>

	<div class="docs-section">
		<h3>Why these adjustments?</h3>
		<ul>
			<li>
				<strong>Fiat 1.3 Multijet / Opel 1.3 CDTi / Alfa 1.3 JTDM</strong> — same Fiat block.
				Timing chain stretch at 120–150k km (expensive fix), EGR/DPF clogging, turbo failures,
				injector issues. Widely labelled a "motor a evitar". Strongest negative flag in the
				model.
			</li>
			<li>
				<strong>VW 1.2/1.4 TSI (EA111) and 1.6 TDI CR (EA189)</strong> — timing chain and
				injector problems respectively. The post-2013 EA211 TSIs corrected most of this and get
				a small bonus instead.
			</li>
			<li>
				<strong>PSA 1.4 HDi / Ford 1.4 TDCi</strong> — shared block, small displacement working
				hard in Fiestas/C3s/207s. Injector and FAP issues are near-universal beyond 150k km.
			</li>
			<li>
				<strong>Renault 1.5 dCi (K9K)</strong> — small penalty. The engine can do 300k km if
				lucky, but K9K-722 onwards had serious injector/turbo runs. The 2013+ Energy dCi variant
				is cleaner; the field value is conservative.
			</li>
			<li>
				<strong>Toyota 1.4 D-4D / VVT-i</strong> — the reference point of durability. 300k km+
				units with just belts and oil are documented. Strong positive bonus.
			</li>
			<li>
				<strong>VAG 1.9 TDI (PD and non-PD)</strong> — the legendary EDC-based diesel. Simple,
				abundant parts, fixable. Positive bonus.
			</li>
		</ul>
	</div>

	<div class="docs-section">
		<h3>What isn't scored</h3>
		<ul>
			<li><strong>Seller behaviour</strong> — note it in the Notes field; not a numeric input.</li>
			<li><strong>Accident history / rust</strong> — impossible to assess remotely. Inspect on visit.</li>
			<li><strong>Options/trim level</strong> — irrelevant for this budget; most listings are base/mid trim.</li>
			<li>
				<strong>FAP/DPF removal</strong> — technically adds torque and reduces failure risk, but
				it's illegal for IPO. The model ignores it.
			</li>
		</ul>
	</div>

	<div class="docs-section">
		<h3>Colour thresholds</h3>
		<p>
			<code>≥ 75</code> green · <code>50–74</code> yellow · <code>&lt; 50</code> red. Don't
			overthink a single-point gap — the model is a ranking aid, not an oracle.
		</p>
	</div>

	<div class="docs-section">
		<h3>Sources &amp; further reading</h3>
		<div class="docs-sources">
			Reliability consensus is distilled from Portuguese used-car community discussions (r/AutoTuga
			threads on "carro até 5000 €"), plus editorial reviews from
			<a href="https://www.razaoautomovel.com/" target="_blank" rel="noopener noreferrer">Razão Automóvel</a>,
			<a href="https://motorguia.net/" target="_blank" rel="noopener noreferrer">Motorguia</a>,
			<a href="https://furiamotor.com/" target="_blank" rel="noopener noreferrer">Furiamotor</a>, and the
			<a href="https://www.e-konomista.pt/motores-diesel-fiaveis/" target="_blank" rel="noopener noreferrer">E-konomista</a>
			diesel-reliability roundup. Engine-specific verdicts are cross-checked against owner forums (ibizaClubPT,
			alfaromeoteam, clubegolfpt).
		</div>
	</div>
</div>

<style>
	.docs-view {
		padding: 8px 0 24px;
	}
	.docs-view h2 {
		font-size: 1.625rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.2;
		margin: 0 0 0.5rem 0;
	}
	.docs-sub {
		color: var(--text-secondary);
		font-size: var(--fs-md);
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}
	.docs-section {
		margin-top: 1.75rem;
	}
	.docs-section h3 {
		font-size: 1.05rem;
		margin-bottom: 0.5rem;
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
		padding: 5px 0;
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
		margin-bottom: 4px;
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
	.docs-weight-card .w-hint {
		font-size: 0.78rem;
		color: var(--text-muted);
		line-height: 1.4;
	}
	.docs-engines {
		display: grid;
		gap: 8px;
		margin-top: 8px;
	}
	.docs-engine-row {
		display: grid;
		grid-template-columns: minmax(140px, 1fr) 60px 2fr;
		gap: 10px;
		align-items: center;
		padding: 8px 12px;
		border-radius: var(--radius-md);
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
	.docs-makes {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 6px;
		margin-top: 8px;
	}
	.docs-make-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 10px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
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
	.docs-sources {
		font-size: 0.78rem;
		color: var(--text-muted);
		line-height: 1.6;
	}
	.docs-sources a {
		color: var(--accent);
		text-decoration: none;
	}
	.docs-sources a:hover {
		text-decoration: underline;
	}
	@media (max-width: 640px) {
		.docs-view {
			padding: 24px 20px 60px;
		}
		.docs-weights {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
