export const SOURCE_MAP: Record<string, string> = {
	'standvirtual.com': 'StandVirtual',
	'autoscout24.pt': 'AutoScout24',
	'olx.pt': 'OLX',
	'facebook.com': 'Facebook Marketplace',
	'piscapisca.pt': 'PiscaPisca',
	'custojusto.pt': 'CustoJusto'
};

// Free-to-list platforms with less moderation than paid aggregators.
// Presence of a structural red flag + a non-paid source bumps scam risk.
export const NON_PAID_SOURCES = new Set(['OLX', 'Facebook Marketplace', 'CustoJusto']);

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

export const DATALIST_ENGINES = [
	'1.4 D-4D',
	'2.0 D-4D',
	'VVT-i',
	'1.9 TDI',
	'1.9 Multijet',
	'Honda i-VTEC',
	'Mazda SkyActiv',
	'1.6 MZ-CD',
	'1.0 TSI EA211',
	'1.2 TSI EA211',
	'1.5 TDCi',
	'1.6 TDCi',
	'1.4 CRDi',
	'1.6 CRDi',
	'1.7 CDTi',
	'1.6 BlueHDi',
	'1.3 Multijet',
	'1.4 HDi',
	'1.6 TDI',
	'1.5 dCi',
	'1.6 HDi',
	'2.0 TDI PD',
	'1.2 TSI (EA111)',
	'1.4 TSI',
	'1.2 TDI',
	'1.4 TDI',
	'1.0 EcoBoost',
	'0.9 TCe',
	'1.2 TCe'
];

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
	yearMin?: number;
	yearMax?: number;
}

export const ENGINE_PROFILES: EngineProfile[] = [
	// --- Positive adjustments (best-known blocks) ---
	{ re: /1\.4\s*d[- ]?4d/i, delta: 18, reason: 'Toyota 1.4 D-4D — ultra-reliable, documented 300k+ km units.' },
	{ re: /vvt[- ]?i/i, delta: 14, reason: 'Toyota VVT-i petrol — bulletproof, cheap to maintain.' },
	{ re: /1\.9\s*tdi/i, delta: 12, reason: 'VAG 1.9 TDI (PD/non-PD) — legendary longevity.' },
	{ re: /honda\b.*\b(i-vtec|vtec)/i, delta: 12, reason: 'Honda VTEC petrol — extremely durable.' },
	{ re: /(2\.0|2\.2)\s*d[- ]?4d/i, delta: 10, reason: 'Toyota 2.0/2.2 D-4D (Avensis/Auris/RAV4) — robust bottom end; early 2.2 D-CAT had piston/injector issues but 2.0 D-4D is strong.' },
	{ re: /1\.9\s*(multijet|jtd)/i, delta: 10, reason: 'Fiat/Alfa 1.9 Multijet — robust, unlike the 1.3 variant.' },
	{ re: /mazda\b.*\b(mzr|skyactiv)/i, delta: 8, reason: 'Mazda MZR / SkyActiv — generally reliable.' },
	{ re: /1\.7\s*cdti/i, delta: 6, reason: 'Opel 1.7 CDTi (Isuzu Y17DT / A17DTJ — Astra, Corsa, Meriva) — Isuzu block, well-regarded longevity; watch EGR valve and swirl flaps.' },
	// EA211 TSI: year-based split (post-2013 fixed the chain issues)
	{ re: /1\.0\s*tsi|1\.2\s*tsi/i, delta: 5, yearMin: 2014, reason: 'VW EA211 TSI (post-2013) — fixed the timing chain issues of the EA111.' },
	{ re: /1\.6\s*crdi/i, delta: 4, reason: 'Kia/Hyundai 1.6 CRDi (U2 / D4FB) — generally reliable Korean diesel, many units past 300k km; watch for EGR/DMF wear on early pre-2011 cars.' },
	{ re: /1\.4\s*crdi/i, delta: 3, reason: 'Kia/Hyundai 1.4 CRDi (D4FC) — solid small Korean diesel (i20, Rio, Venga); watch EGR/DPF on urban-use units.' },
	// 1.6 TDI: EA288 (2015+) is reliable; EA189 (pre-2015) is penalised below
	{ re: /1\.6\s*tdi/i, delta: 2, yearMin: 2015, reason: 'VW 1.6 TDI EA288 (2015+) — addresses EA189 injector/EGR issues; generally reliable when serviced.' },
	{ re: /1\.5\s*tdci|1\.6\s*tdci/i, delta: 2, reason: 'Ford 1.5/1.6 TDCi — refined PSA block, reasonably reliable.' },
	{ re: /1\.6\s*mz[- ]?cd/i, delta: 2, reason: 'Mazda 1.6 MZ-CD (Mazda 3 BK/BL) — rebadged PSA DV6 / Ford 1.6 TDCi block; refined, reasonably reliable.' },
	{ re: /1\.6\s*bluehdi/i, delta: 2, reason: 'PSA 1.6 BlueHDi (DV5/DV6FC, post-2014) — improved successor to 1.6 HDi; AdBlue/SCR sensors can be a maintenance point but bottom end is strong.' },

	// --- Negative adjustments (ordered by severity) ---
	{ re: /1\.3\s*(multijet|m[- ]?jet|jtd|cdti)/i, delta: -16, reason: 'Fiat/Opel 1.3 Multijet/JTD/CDTi — timing chain stretch 120–150k km, EGR/DPF clogs, turbo failures. Widely flagged as "motor a evitar".' },
	{ re: /1\.4\s*(hdi|tdci)/i, delta: -10, reason: 'PSA 1.4 HDi / Ford 1.4 TDCi — injector and FAP issues, oil sludge.' },
	// 1.2 TSI EA111: year-based split (pre-2014 is the bad chain variant)
	{ re: /1\.2\s*tsi/i, delta: -10, yearMax: 2013, reason: 'VW 1.2 TSI (EA111, pre-2014) — timing chain stretch, tensioner failures.' },
	{ re: /1\.4\s*tsi/i, delta: -10, reason: 'VW 1.4 TSI — timing chain, carbon build-up, oil consumption.' },
	{ re: /\b(n12|n14|n18)\b|1\.6\s*thp/i, delta: -10, reason: 'BMW/PSA Prince (N12/N14/N18 — Mini R56, Peugeot 207/208 THP, Citroën DS3) — timing chain stretch, carbon build-up, high oil consumption, water pump failures.' },
	// 1.6 TDI EA189: only penalise pre-2015 (post-2015 caught by EA288 rule above)
	{ re: /1\.6\s*tdi/i, delta: -9, yearMax: 2014, reason: 'VW 1.6 TDI EA189 (pre-2015) — injector/EGR issues, sensitive to urban use, DieselGate era.' },
	{ re: /\bn47\b/i, delta: -8, reason: 'BMW N47 2.0d (pre-2011 320d/520d/X3) — timing chain at the rear of the block; failure requires engine-out, €2–3k job.' },
	{ re: /(0\.9|1\.2)\s*tce/i, delta: -8, reason: 'Renault 0.9/1.2 TCe (H4Bt / H5Ft) — heavy oil consumption, piston ring failure, turbo wear; repair costs dwarf €5k-tier purchase price.' },
	{ re: /1\.6\s*dci/i, delta: -7, reason: 'Renault 1.6 dCi (R9M / Energy dCi) — timing chain stretch (pre-2015), oil consumption, injector and turbo failures; same block sold to Mercedes as OM626 with documented issues.' },
	{ re: /1\.4\s*tdi/i, delta: -7, reason: 'VW 1.4 TDI 3-cyl (PD / EA189 CR, pre-EA288) — DPF clogging on short trips, turbo failures from ~110k km, EGR coking; Dieselgate-era CR variants affected.' },
	{ re: /2\.0\s*tdi.*(cbab|cbdb|cfgb)|2\.0\s*tdi.*pd/i, delta: -6, reason: '2.0 TDI PD / early CR — oil pump balance-shaft failures, FAP issues.' },
	// 1.0 EcoBoost wet-belt issue was fixed from 2017 onwards
	{ re: /1\.0\s*ecoboost/i, delta: -6, yearMax: 2016, reason: 'Ford 1.0 EcoBoost (pre-2017) — wet timing belt degradation, coolant loss and cylinder head cracks on early units; expensive to repair.' },
	{ re: /a14net|b14net/i, delta: -6, reason: 'Opel 1.4 Turbo (A14NET/B14NET — Astra J, Corsa D) — timing chain stretch, coolant leaks, carbon build-up.' },
	{ re: /\bom651\b|2\.1\s*cdi/i, delta: -6, reason: 'Mercedes OM651 2.1 CDI (pre-2014 C/E/Sprinter) — injector failures, timing chain wear, turbo actuator issues.' },
	{ re: /1\.5\s*dci/i, delta: -5, reason: 'Renault 1.5 dCi (K9K) — mixed track record; early units plagued by injectors and turbo failure.' },
	{ re: /1\.6\s*hdi/i, delta: -4, reason: 'PSA 1.6 HDi — early units (pre-2010) had injector seal failures; FAP additive management needed.' },
	{ re: /1\.2\s*tdi/i, delta: -4, reason: 'VW 1.2 TDI 3-cyl — fragile in cold starts, DPF issues on short trips.' }
];

export const SCORE_WEIGHTS = { km: 0.22, price: 0.22, reliability: 0.3, year: 0.13, location: 0.13 };

export const PRICE_THRESHOLDS = {
	sweetSpot: 2500,
	budget: 5000,
	ceiling: 7500
};
