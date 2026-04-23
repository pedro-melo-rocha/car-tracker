export const SOURCE_MAP: Record<string, string> = {
	'standvirtual.com': 'StandVirtual',
	'autoscout24.pt': 'AutoScout24',
	'olx.pt': 'OLX',
	'facebook.com': 'Facebook Marketplace',
	'piscapisca.pt': 'PiscaPisca',
	'custojusto.pt': 'CustoJusto'
};

export const ENGINE_CODES: Record<string, string> = {
	tdi: 'TDI',
	tsi: 'TSI',
	dci: 'dCi',
	hdi: 'HDi',
	tdci: 'TDCi',
	cdti: 'CDTi',
	crdi: 'CRDi',
	multijet: 'Multijet',
	vvti: 'VVT-i',
	vtec: 'VTEC',
	mpi: 'MPI',
	fsi: 'FSI',
	bluehdi: 'BlueHDi',
	blueefficiency: 'BlueEfficiency',
	ecoboost: 'EcoBoost',
	ecotec: 'Ecotec',
	d4d: 'D-4D',
	skyactiv: 'SkyActiv',
	tce: 'TCe',
	dig: 'DIG',
	jtd: 'JTD',
	jtdm: 'JTDm'
};

export const ENGINE_CODE_RE = new RegExp('^(' + Object.keys(ENGINE_CODES).join('|') + ')$');

export const DATALIST_MAKES = [
	'Audi',
	'BMW',
	'Citroën',
	'Dacia',
	'Fiat',
	'Ford',
	'Honda',
	'Hyundai',
	'Kia',
	'Mazda',
	'Mercedes-Benz',
	'Mitsubishi',
	'Nissan',
	'Opel',
	'Peugeot',
	'Renault',
	'Seat',
	'Skoda',
	'Suzuki',
	'Toyota',
	'Volkswagen',
	'Volvo'
];

// DATALIST_ENGINES is derived from ENGINE_PROFILES at the bottom of this module.

export const EXTRA_MAKES = [
	'Alfa Romeo',
	'Aston Martin',
	'Chevrolet',
	'Chrysler',
	'DS',
	'Dodge',
	'Jaguar',
	'Jeep',
	'Lancia',
	'Land Rover',
	'Lexus',
	'Mini',
	'Porsche',
	'Saab',
	'Smart',
	'Subaru',
	'Tesla',
	'Citroen'
];

export const FUEL_MAP: Record<string, string> = {
	diesel: 'Diesel',
	gasolina: 'Gasolina',
	gasoline: 'Gasolina',
	petrol: 'Gasolina'
};

export const LOCATION_DISTANCES: Record<string, number> = {
	'viana do castelo': 0,
	viana: 0,
	braga: 50,
	barcelos: 35,
	'guimarães': 65,
	guimaraes: 65,
	'famalicão': 55,
	famalicao: 55,
	porto: 75,
	gaia: 80,
	'vila nova de gaia': 80,
	maia: 70,
	matosinhos: 75,
	gondomar: 85,
	'vila real': 100,
	chaves: 130,
	'bragança': 200,
	braganca: 200,
	aveiro: 140,
	espinho: 110,
	viseu: 180,
	guarda: 260,
	coimbra: 220,
	leiria: 280,
	'castelo branco': 350,
	'santarém': 340,
	santarem: 340,
	lisboa: 390,
	sintra: 400,
	cascais: 410,
	amadora: 390,
	loures: 385,
	almada: 400,
	portalegre: 420,
	'setúbal': 410,
	setubal: 410,
	'évora': 450,
	evora: 450,
	beja: 500,
	faro: 550,
	'portimão': 560,
	portimao: 560,
	albufeira: 555,
	'loulé': 550,
	loule: 550
};

export const MAKE_RELIABILITY: Record<string, number> = {
	toyota: 90,
	lexus: 92,
	honda: 88,
	mazda: 82,
	suzuki: 76,
	subaru: 70,
	hyundai: 74,
	kia: 72,
	nissan: 64,
	volvo: 66,
	skoda: 72,
	vw: 66,
	volkswagen: 66,
	audi: 62,
	seat: 62,
	ford: 60,
	opel: 58,
	mini: 52,
	bmw: 62,
	mercedes: 60,
	'mercedes-benz': 60,
	dacia: 56,
	renault: 54,
	peugeot: 54,
	citroen: 50,
	'citroën': 50,
	fiat: 48,
	'alfa romeo': 42,
	lancia: 42,
	chevrolet: 52
};

export const MAKE_RELIABILITY_NOTES: Record<string, string> = {
	toyota: 'Benchmark for long-term durability. TÜV and CR consistently top-tier; simple drivetrains age well.',
	lexus: 'Toyota underpinnings with tighter QC; regularly #1 in dependability surveys.',
	honda: 'VTEC petrols and K-series are extremely durable; electronics and trim hold up well past 200k km.',
	mazda: 'Consistently within a few points of Toyota/Honda in TÜV and CR. SkyActiv-G petrols are very durable; early 2.2 SkyActiv-D has DPF/oil-dilution issues (handled at engine level).',
	suzuki: 'Simple, light, low-complexity mechanicals. Small petrols are long-lived and cheap to maintain.',
	subaru: 'Pre-2011 EJ boxer head-gasket issues, Lineartronic CVT concerns, and thin EU parts/specialist network in Portugal hurt real-world reliability. US/AU survey data inflates global perception.',
	hyundai: 'Modern Korean engineering ranks top-5 in European surveys; long warranties reflect genuine confidence.',
	kia: 'Shares platforms and engines with Hyundai; marginally behind on historical data but very close.',
	nissan: 'Jatco CVT failures on Qashqai/Juke/X-Trail are a brand-level liability at 100–150k km. 1.5 dCi diesel is a further weak spot (penalized at engine level). Global surveys — inflated by US/JP market data — overstate Nissan in the European used fleet.',
	volvo: 'Pre-2014 5-cyl diesels (especially D5) are genuine tanks, but Drive-E era introduced timing-belt-in-oil and electronics gremlins, and Ford-era 1.6D (PSA DV6) is problematic. Older-generation nostalgia doesn\u2019t fully carry the modern range.',
	skoda: 'VAG platforms with simpler trim and fewer electronics than VW/Audi. Warranty Direct and What Car? surveys consistently rank Skoda 5–8 points above VW.',
	vw: 'Solid mechanicals when paired with a good engine, but DSG, MMI/infotainment, and chain-driven TSI/TDI variants pull the average down.',
	volkswagen: 'Solid mechanicals when paired with a good engine, but DSG, MMI/infotainment, and chain-driven TSI/TDI variants pull the average down.',
	audi: 'More tech per car than VW (MMI, adaptive suspension, DSG prevalence) means more systems to fail as cars age. European long-term surveys consistently place Audi below VW.',
	seat: 'VAG platforms with Spanish assembly and cost-cut trim; sits slightly below VW in long-term data.',
	ford: 'PowerShift DCT (Fiesta/Focus 2011–2016) was class-action territory; electrical gremlins and rust round out the weak spots. 1.0 EcoBoost wet-belt is flagged separately at engine level.',
	opel: 'Inconsistent across eras: Isuzu-sourced 1.7 CDTi is solid, GM-era electronics are weak. Post-PSA (2017+) improved but rarely in €5k window.',
	mini: 'At the €5k tier Minis are R56/R55/R57-era, dominated by the BMW/PSA Prince N12/N14 engine: timing chain stretch, carbon build-up, heavy oil consumption, water pump failures. The engine itself is also flagged separately.',
	bmw: 'At the €5k tier, BMW is arguably more predictable than Mercedes of the same era — simpler chassis tech, less adaptive suspension. Known weak spots (N47 timing chain, VANOS) are engine-specific and handled downstream.',
	mercedes: 'W211/W204-era AirMatic failures, rust on pre-facelift W211, OM651 injector/timing chain issues, SBC brake module. Premium badge doesn\u2019t offset chassis-era problems at this age.',
	'mercedes-benz': 'W211/W204-era AirMatic failures, rust on pre-facelift W211, OM651 injector/timing chain issues, SBC brake module. Premium badge doesn\u2019t offset chassis-era problems at this age.',
	dacia: 'Owner surveys inflate Dacia (simple mechanicals, cheap repairs, young fleet), but German TÜV defect reports rank it near the bottom on 8–12 yr cars — worn suspension, brake corrosion, light/electrical faults. Diesels all use the 1.5 dCi, flagged at engine level.',
	renault: 'French electrics and a weak diesel lineup (1.5/1.6 dCi) drag the average. Petrols are middling; TCe turbos have serious oil-consumption issues (handled at engine level).',
	peugeot: 'Stellantis diesels (1.6 BlueHDi) are decent, but 1.4/1.6 HDi-era injector and FAP issues, plus electrics, keep the baseline below average.',
	citroen: 'Peugeot twin with extra electrical and hydropneumatic complexity (older C5). Slightly below Peugeot in most EU datasets.',
	'citroën': 'Peugeot twin with extra electrical and hydropneumatic complexity (older C5). Slightly below Peugeot in most EU datasets.',
	fiat: 'Genuinely poor in long-term surveys: electrics, trim, rust, and the 1.3 Multijet timing chain epidemic. 1.9 Multijet is the one bright spot (engine level).',
	'alfa romeo': 'Harsh but honest for the €5k tier. Modern Giulia improved, but none reach this budget. Electrics and build quality drag historical data.',
	lancia: 'Same story as Fiat/Alfa; late-era Lancias are rebadged Chryslers with their own quality issues.',
	chevrolet: 'Chevrolets in the European market (Aveo/Cruze/Captiva) are rebadged Daewoo. Build quality is below average and parts support has thinned out since the brand left Europe in 2016.'
};

export interface EngineProfile {
	re: RegExp;
	delta: number;
	reason: string;
	/** Human-readable label used by the engine autocomplete. Year-split rules in the same family share a label. */
	label: string;
	yearMin?: number;
	yearMax?: number;
	fuel?: 'Diesel' | 'Gasolina';
}

export const ENGINE_PROFILES: EngineProfile[] = [
	// --- Positive adjustments (best-known blocks) ---
	// 2.2 D-4D pre-2010 head-gasket exception — MUST come before the broad 2.0/2.2 D-4D rule below.
	{ re: /2\.2\s*d[- ]?4d/i, label: '2.2 D-4D', delta: -2, yearMax: 2009, fuel: 'Diesel', reason: 'Toyota 2.2 D-4D (2AD-FTV) pre-2010 — notorious head-gasket failures on 2005–2008 units; Toyota revised gasket material from 2010.' },
	{ re: /1\.4\s*d[- ]?4d/i, label: '1.4 D-4D', delta: 10, fuel: 'Diesel', reason: 'Toyota 1.4 D-4D (1ND-TV) — aluminum block (no rebore), turbo failures documented; less bulletproof than the 2.0 D-4D legend suggests, but still above average.' },
	{ re: /vvt[- ]?i/i, label: 'VVT-i', delta: 14, fuel: 'Gasolina', reason: 'Toyota VVT-i petrol — bulletproof to ~100k mi; post-100k oil consumption and chain stretch appear but rarely terminal.' },
	{ re: /1\.9\s*tdi/i, label: '1.9 TDI', delta: 12, fuel: 'Diesel', reason: 'VAG 1.9 TDI (PD/ALH) — legendary longevity, 300k+ km documented.' },
	{ re: /honda\b.*\b(i-vtec|vtec)/i, label: 'Honda i-VTEC', delta: 12, fuel: 'Gasolina', reason: 'Honda VTEC/i-VTEC petrol — extremely durable; R18A oil consumption after 100k the only common caveat.' },
	{ re: /(2\.0|2\.2)\s*d[- ]?4d/i, label: '2.0 D-4D', delta: 10, fuel: 'Diesel', reason: 'Toyota 2.0 D-4D (1AD-FTV) / 2.2 D-4D post-2010 (revised head gasket) — robust bottom end.' },
	{ re: /1\.9\s*(multijet|jtd)/i, label: '1.9 Multijet', delta: 10, fuel: 'Diesel', reason: 'Fiat/Alfa 1.9 Multijet — robust, unlike the 1.3 variant. 8V preferred (water pump off aux belt).' },
	// Mazda MZR is petrol, SkyActiv spans both (G petrol, D diesel) — leave fuel agnostic.
	{ re: /mazda\b.*\b(mzr|skyactiv)/i, label: 'Mazda SkyActiv', delta: 8, reason: 'Mazda MZR / SkyActiv-G — near-bulletproof per owner data; MAF sensor and carbon build-up minor.' },
	{ re: /1\.7\s*cdti/i, label: '1.7 CDTi', delta: 6, fuel: 'Diesel', reason: 'Opel 1.7 CDTi (Isuzu Y17DT / A17DTJ — Astra, Corsa, Meriva) — most reliable GM diesel; 200k+ km common. Watch EGR and swirl flaps.' },
	// EA211 TSI: year-based split (post-2013 fixed the chain issues)
	{ re: /1\.0\s*tsi|1\.2\s*tsi/i, label: '1.2 TSI', delta: 5, yearMin: 2014, fuel: 'Gasolina', reason: 'VW EA211 TSI (post-2013) — belt-driven, fixed the EA111 chain issues; EVO revisions from 2016 further improved.' },
	{ re: /1\.6\s*crdi/i, label: '1.6 CRDi', delta: 4, fuel: 'Diesel', reason: 'Kia/Hyundai 1.6 CRDi (U2 / D4FB) — 250k km typical; Bosch injectors wear 120–180k.' },
	// 1.6 TDI: EA288 (2015+) is reliable; EA189 (pre-2015) is penalised below
	{ re: /1\.6\s*tdi/i, label: '1.6 TDI', delta: 2, yearMin: 2015, fuel: 'Diesel', reason: 'VW 1.6 TDI EA288 (2015+) — addresses EA189 injector/EGR issues; generally reliable when serviced.' },
	{ re: /1\.5\s*tdci/i, label: '1.5 TDCi', delta: 2, yearMin: 2015, fuel: 'Diesel', reason: 'Ford 1.5 TDCi EcoBlue (2015+) — clean-sheet block replacing the PSA DV6; more reliable than the 1.6 TDCi predecessor.' },
	{ re: /1\.6\s*bluehdi/i, label: '1.6 BlueHDi', delta: 2, fuel: 'Diesel', reason: 'PSA 1.6 BlueHDi (DV5/DV6FC, post-2014) — bottom end is strong; AdBlue/SCR/NOx-sensor add cost but rarely engine-terminal.' },
	{ re: /1\.4\s*crdi/i, label: '1.4 CRDi', delta: 1, fuel: 'Diesel', reason: 'Kia/Hyundai 1.4 CRDi (D4FC — i20, Rio, Venga) — fuel pump at 80–120k, DPF on short trips; only marginally better than a neutral Korean baseline.' },

	// --- Negative adjustments (ordered by severity) ---
	{ re: /1\.3\s*(multijet|m[- ]?jet|jtd|cdti)/i, label: '1.3 Multijet', delta: -16, fuel: 'Diesel', reason: 'Fiat/Opel 1.3 Multijet/JTD/CDTi — timing chain stretch 120–150k km, EGR/DPF clogs, turbo failures. Widely flagged as "motor a evitar".' },
	{ re: /1\.3\s*ddis/i, label: '1.3 DDiS', delta: -14, fuel: 'Diesel', reason: 'Suzuki 1.3 DDiS (Swift, Ignis, Wagon R+) — Fiat 1.3 Multijet under licence; marginally better owner-reported reliability in the lighter Suzuki install.' },
	{ re: /\bn47\b/i, label: 'N47 2.0d', delta: -10, yearMax: 2011, fuel: 'Diesel', reason: 'BMW N47 2.0d (Mar 2007 – Mar 2011 — 320d/520d/X3) — timing chain at the rear of the block; failure requires engine-out, £1.5–6.5k job.' },
	// 1.2 TSI EA111: year-based split (pre-2014 is the bad chain variant)
	{ re: /1\.2\s*tsi/i, label: '1.2 TSI', delta: -10, yearMax: 2013, fuel: 'Gasolina', reason: 'VW 1.2 TSI (EA111, pre-2014) — timing chain stretch, tensioner failures.' },
	{ re: /1\.4\s*tsi/i, label: '1.4 TSI', delta: -10, fuel: 'Gasolina', reason: 'VW 1.4 TSI twincharger (CAVD/CAXA) — timing chain tensioner at 100k, piston/ring failures on Golf-gen CAVD; CTHD (2012+) fixed most of it.' },
	// Prince: N18 (2011+) rule MUST come before the N12/N14 catch-all below.
	{ re: /\bn18\b/i, label: 'Prince N18', delta: -5, yearMin: 2011, fuel: 'Gasolina', reason: 'BMW/PSA Prince N18 (Mini R56 LCI, 2011+) — addressed the N14 timing chain, vacuum pump and coking issues; still direct-injection so some carbon build-up remains.' },
	{ re: /\b(n12|n14)\b|1\.6\s*thp/i, label: 'Prince N12/N14', delta: -10, fuel: 'Gasolina', reason: 'BMW/PSA Prince N12/N14 (Mini R56, Peugeot 207/208 THP, Citroën DS3) — timing chain stretch, carbon build-up, high oil consumption, water pump failures.' },
	// 1.6 TDI EA189: only penalise pre-2015 (post-2015 caught by EA288 rule above)
	{ re: /1\.6\s*tdi/i, label: '1.6 TDI', delta: -9, yearMax: 2014, fuel: 'Diesel', reason: 'VW 1.6 TDI EA189 (pre-2015) — Siemens piezo injector insulation breakdown; EGR worsened by Dieselgate emissions fix.' },
	// OM651: post-2011 magnetic-injector rule MUST come before pre-2011 piezo-injector catch-all.
	{ re: /\bom651\b|2\.1\s*cdi/i, label: 'OM651 2.1 CDI', delta: -3, yearMin: 2011, fuel: 'Diesel', reason: 'Mercedes OM651 2.1 CDI (magnetic injectors, spring 2011+) — replaces failure-prone Delphi piezo injectors; timing chain/tensioner issues remain.' },
	{ re: /\bom651\b|2\.1\s*cdi/i, label: 'OM651 2.1 CDI', delta: -8, yearMax: 2010, fuel: 'Diesel', reason: 'Mercedes OM651 2.1 CDI (Delphi piezo injectors, pre-mid-2010) — signature injector failures, timing chain wear, turbo actuator issues.' },
	{ re: /1\.2\s*tdi/i, label: '1.2 TDI', delta: -8, fuel: 'Diesel', reason: 'VW 1.2 TDI 3-cyl (CFWA) — 460k-car fuel-filter recall, Siemens piezo injector failures, DPF clogging on short trips; worse than the 1.4 TDI 3-cyl.' },
	{ re: /(0\.9|1\.2)\s*tce/i, label: '1.2 TCe', delta: -8, fuel: 'Gasolina', reason: 'Renault 0.9/1.2 TCe (H4Bt / H5Ft) — piston-ring tolerance defect consumes 1L/1000km in affected units; repair €500–1500 plus consequential damage.' },
	{ re: /1\.4\s*(hdi|tdci)/i, label: '1.4 HDi', delta: -7, fuel: 'Diesel', reason: 'PSA 1.4 HDi (DV4) / Ford 1.4 TDCi — chronic injector seal leakage, extraction sometimes impossible; FAP/EGR build-up. Block itself is durable (300k+) but ancillary costs accumulate.' },
	{ re: /1\.4\s*mz[- ]?cd/i, label: '1.4 MZ-CD', delta: -7, fuel: 'Diesel', reason: 'Mazda 1.4 MZ-CD (Mazda 2) — rebadged PSA DV4; same injector-seal and FAP issues as 1.4 HDi.' },
	{ re: /1\.6\s*dci/i, label: '1.6 dCi', delta: -7, fuel: 'Diesel', reason: 'Renault 1.6 dCi R9M (Energy dCi) — timing chain stretch 140–150k vs 250k design, dual-EGR clogging, oil leaks around chain cover; same block sold to Mercedes as OM626.' },
	// 1.5 dCi: post-2011 K9K 8xx rule MUST come before pre-2011 catch-all.
	{ re: /1\.5\s*dci/i, label: '1.5 dCi', delta: -3, yearMin: 2011, fuel: 'Diesel', reason: 'Renault 1.5 dCi K9K 8xx (2011+) — upgraded injectors and turbo oil feed; adequate workhorse when serviced on synthetic RN0700/RN0710.' },
	{ re: /1\.5\s*dci/i, label: '1.5 dCi', delta: -7, yearMax: 2010, fuel: 'Diesel', reason: 'Renault 1.5 dCi K9K pre-2011 — Delphi injector and turbo failures, connecting-rod bearing risk from long oil intervals.' },
	// 1.4 TDI: EA288 (2015+) post-2015 rare rule MUST come before pre-2015 catch-all.
	{ re: /1\.4\s*tdi/i, label: '1.4 TDI', delta: -2, yearMin: 2015, fuel: 'Diesel', reason: 'VW 1.4 TDI EA288 (2015+ — rare as 3-cyl, most later 1.4 TDIs are 4-cyl) — improved SCR/AdBlue, notably more reliable than EA189.' },
	{ re: /1\.4\s*tdi/i, label: '1.4 TDI', delta: -6, yearMax: 2014, fuel: 'Diesel', reason: 'VW 1.4 TDI 3-cyl PD / EA189 CR (pre-2015) — DPF clogging, turbo failures ~110k, EGR coking; Dieselgate-era CR variants affected.' },
	{ re: /2\.0\s*tdi.*(cbab|cbdb|cfgb)|2\.0\s*tdi.*pd/i, label: '2.0 TDI PD', delta: -6, fuel: 'Diesel', reason: '2.0 TDI PD / early CR (Passat/A4/Superb BKP/BLB/BPW/BRE/BNA/BMA, CBAB/CBDB/CFGB) — balance-shaft oil-pump drive failure 60–100k. BKD/AZV/BMN (Golf/Octavia/A3) NOT affected (chain-driven oil pump).' },
	// 1.0 EcoBoost wet-belt issue was fixed from 2017 onwards
	{ re: /1\.0\s*ecoboost/i, label: '1.0 EcoBoost', delta: -6, yearMax: 2016, fuel: 'Gasolina', reason: 'Ford 1.0 EcoBoost (pre-2017) — wet timing belt degradation, coolant loss and cylinder head cracks on early units; £1000+ repair. Fixed with chain drive from 2018.' },
	{ re: /a14net|b14net/i, label: '1.4 Turbo (A14NET)', delta: -6, fuel: 'Gasolina', reason: 'Opel 1.4 Turbo (A14NET/B14NET — Astra J, Corsa D) — timing chain stretch documented at low mileage, accelerated by soot in oil.' },
	// 1.6 HDi: post-2011 8V SOHC rule MUST come before pre-2011 16V DOHC catch-all.
	{ re: /1\.6\s*hdi/i, label: '1.6 HDi', delta: -2, yearMin: 2011, fuel: 'Diesel', reason: 'PSA 1.6 HDi 8V SOHC (DV6B, 2011+) — re-engineered to address the injector seal / turbo oiling issues of the 16V DOHC DV6 TED4.' },
	{ re: /1\.6\s*hdi/i, label: '1.6 HDi', delta: -6, yearMax: 2010, fuel: 'Diesel', reason: 'PSA 1.6 HDi 16V DOHC (DV6 TED4, pre-2011) — injector carbon leakage → turbo oil starvation; most common failure path on this era.' },
	{ re: /1\.6\s*tdci/i, label: '1.6 TDCi', delta: -4, fuel: 'Diesel', reason: 'Ford 1.6 TDCi (DLD-416 / PSA DV6) — same block and failure path as 1.6 HDi; sludge-fed turbo failure, injector wear.' },
	{ re: /1\.6\s*mz[- ]?cd/i, label: '1.6 MZ-CD', delta: -4, fuel: 'Diesel', reason: 'Mazda 1.6 MZ-CD (Mazda 3 BK/BL) — rebadged PSA DV6; injector replacements often before 130k, DPF contaminates oil.' }
];

export const SCORE_WEIGHTS = { km: 0.22, price: 0.22, reliability: 0.3, year: 0.13, location: 0.13 };

export const PRICE_THRESHOLDS = {
	sweetSpot: 2500,
	budget: 5000,
	ceiling: 7500
};

/** Engine autocomplete options — derived from ENGINE_PROFILES so it stays in sync with the scoring rules. */
export const DATALIST_ENGINES: string[] = Array.from(new Set(ENGINE_PROFILES.map((p) => p.label)));

/**
 * Typical engine options seen in the Portuguese used-car market, keyed by `${makeLower}:${modelLower}`.
 * Used to rank the engine autocomplete when the user has filled make + model.
 * Model keys are matched case-insensitively; partial/prefix model matches are acceptable (e.g. "A3" matches "a3 sportback").
 * Curated — not exhaustive. Extend as new listings surface.
 */
export const MODEL_ENGINE_HINTS: Record<string, string[]> = {
	// VAG
	'vw:polo': ['1.2 TSI', '1.2 TDI', '1.4 TDI', '1.2'],
	'volkswagen:polo': ['1.2 TSI', '1.2 TDI', '1.4 TDI', '1.2'],
	'vw:golf': ['1.6 TDI', '1.9 TDI', '1.4 TSI', '2.0 TDI PD', '1.2 TSI'],
	'volkswagen:golf': ['1.6 TDI', '1.9 TDI', '1.4 TSI', '2.0 TDI PD', '1.2 TSI'],
	'vw:passat': ['1.9 TDI', '2.0 TDI PD', '1.6 TDI', '1.4 TSI'],
	'volkswagen:passat': ['1.9 TDI', '2.0 TDI PD', '1.6 TDI', '1.4 TSI'],
	'seat:ibiza': ['1.2 TSI', '1.2 TDI', '1.4 TDI', '1.9 TDI'],
	'seat:leon': ['1.6 TDI', '1.9 TDI', '2.0 TDI PD', '1.4 TSI'],
	'skoda:fabia': ['1.2 TSI', '1.2 TDI', '1.4 TDI'],
	'skoda:octavia': ['1.6 TDI', '1.9 TDI', '2.0 TDI PD', '1.4 TSI'],
	'audi:a3': ['1.6 TDI', '1.9 TDI', '2.0 TDI PD', '1.4 TSI', '1.2 TSI'],
	'audi:a4': ['1.9 TDI', '2.0 TDI PD', '1.6 TDI'],
	// PSA / Ford / Mazda shared DV4/DV6
	'peugeot:207': ['1.4 HDi', '1.6 HDi', 'Prince N12/N14'],
	'peugeot:208': ['1.4 HDi', '1.6 HDi', '1.6 BlueHDi', 'Prince N12/N14'],
	'peugeot:308': ['1.6 HDi', '1.6 BlueHDi', '1.6 TDCi'],
	'citroen:c3': ['1.4 HDi', '1.6 HDi', '1.6 BlueHDi'],
	'citroën:c3': ['1.4 HDi', '1.6 HDi', '1.6 BlueHDi'],
	'citroen:c4': ['1.6 HDi', '1.6 BlueHDi'],
	'citroën:c4': ['1.6 HDi', '1.6 BlueHDi'],
	'ford:fiesta': ['1.4 HDi', '1.6 TDCi', '1.0 EcoBoost', '1.5 TDCi'],
	'ford:focus': ['1.6 TDCi', '1.0 EcoBoost', '1.5 TDCi'],
	'mazda:2': ['1.4 MZ-CD'],
	'mazda:3': ['1.6 MZ-CD', 'Mazda SkyActiv'],
	'mazda:6': ['Mazda SkyActiv'],
	// Renault-Nissan-Dacia
	'renault:clio': ['1.5 dCi', '1.2 TCe', '0.9 TCe'],
	'renault:megane': ['1.5 dCi', '1.6 dCi', '1.2 TCe'],
	'renault:captur': ['1.5 dCi', '1.2 TCe', '0.9 TCe'],
	'nissan:qashqai': ['1.5 dCi', '1.6 dCi', '1.2 TCe'],
	'nissan:juke': ['1.5 dCi', '1.2 TCe'],
	'dacia:sandero': ['1.5 dCi', '0.9 TCe'],
	'dacia:duster': ['1.5 dCi', '1.2 TCe'],
	// Opel
	'opel:corsa': ['1.3 Multijet', '1.7 CDTi', '1.4 Turbo (A14NET)'],
	'opel:astra': ['1.7 CDTi', '1.3 Multijet', '1.4 Turbo (A14NET)'],
	// Italian
	'fiat:punto': ['1.3 Multijet', '1.9 Multijet'],
	'fiat:500': ['1.3 Multijet'],
	'alfa romeo:mito': ['1.3 Multijet', '1.4 TSI'],
	'alfa romeo:147': ['1.9 Multijet'],
	'alfa romeo:159': ['1.9 Multijet'],
	// BMW / Mini / Mercedes
	'bmw:320d': ['N47 2.0d'],
	'bmw:520d': ['N47 2.0d'],
	'mini:cooper': ['Prince N12/N14', 'Prince N18'],
	'mini:cooper s': ['Prince N12/N14', 'Prince N18'],
	'mercedes-benz:c-class': ['OM651 2.1 CDI'],
	'mercedes:c-class': ['OM651 2.1 CDI'],
	// Korean / Japanese
	'hyundai:i20': ['1.4 CRDi'],
	'hyundai:i30': ['1.4 CRDi', '1.6 CRDi'],
	'kia:ceed': ['1.4 CRDi', '1.6 CRDi'],
	'kia:rio': ['1.4 CRDi'],
	'toyota:yaris': ['1.4 D-4D', 'VVT-i'],
	'toyota:auris': ['1.4 D-4D', '2.0 D-4D', 'VVT-i'],
	'toyota:corolla': ['2.0 D-4D', 'VVT-i'],
	'toyota:avensis': ['2.0 D-4D', '2.2 D-4D'],
	'toyota:rav4': ['2.0 D-4D', '2.2 D-4D'],
	'honda:civic': ['Honda i-VTEC'],
	'honda:jazz': ['Honda i-VTEC'],
	'suzuki:swift': ['1.3 DDiS']
};

/** Case-insensitive lookup on MODEL_ENGINE_HINTS: returns the hint array for the given make+model, or [] if no match. */
export function getModelEngineHints(make: string | null | undefined, model: string | null | undefined): string[] {
	if (!make || !model) return [];
	const m = make.toLowerCase().trim();
	const mo = model.toLowerCase().trim();
	const exact = MODEL_ENGINE_HINTS[`${m}:${mo}`];
	if (exact) return exact;
	// Prefix/substring fallback so "A3 Sportback" → "audi:a3" still matches.
	for (const key in MODEL_ENGINE_HINTS) {
		const [km, kmo] = key.split(':');
		if (km === m && (mo.startsWith(kmo) || kmo.startsWith(mo))) {
			return MODEL_ENGINE_HINTS[key];
		}
	}
	return [];
}
