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

export const DATALIST_ENGINES = [
	'1.4 D-4D',
	'VVT-i',
	'1.9 TDI',
	'1.9 Multijet',
	'Honda i-VTEC',
	'Mazda SkyActiv',
	'1.0 TSI EA211',
	'1.2 TSI EA211',
	'1.5 TDCi',
	'1.6 TDCi',
	'1.3 Multijet',
	'1.4 HDi',
	'1.6 TDI',
	'1.5 dCi',
	'1.6 HDi',
	'2.0 TDI PD',
	'1.2 TSI',
	'1.4 TSI',
	'1.2 TDI',
	'1.4 TDI'
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
	mazda: 78,
	suzuki: 76,
	subaru: 74,
	hyundai: 74,
	kia: 72,
	nissan: 72,
	volvo: 70,
	skoda: 72,
	vw: 66,
	volkswagen: 66,
	audi: 64,
	seat: 62,
	ford: 64,
	opel: 58,
	mini: 58,
	bmw: 60,
	mercedes: 62,
	'mercedes-benz': 62,
	dacia: 62,
	renault: 54,
	peugeot: 54,
	citroen: 50,
	'citroën': 50,
	fiat: 48,
	'alfa romeo': 42,
	lancia: 42,
	chevrolet: 52
};

export interface EngineProfile {
	re: RegExp;
	delta: number;
	reason: string;
}

export const ENGINE_PROFILES: EngineProfile[] = [
	{ re: /1\.4\s*d[- ]?4d/i, delta: 18, reason: 'Toyota 1.4 D-4D — ultra-reliable, documented 300k+ km units.' },
	{ re: /vvt[- ]?i/i, delta: 14, reason: 'Toyota VVT-i petrol — bulletproof, cheap to maintain.' },
	{ re: /1\.9\s*tdi/i, delta: 12, reason: 'VAG 1.9 TDI (PD/non-PD) — legendary longevity.' },
	{ re: /1\.9\s*(multijet|jtd)/i, delta: 10, reason: 'Fiat/Alfa 1.9 Multijet — robust, unlike the 1.3 variant.' },
	{ re: /honda\b.*\b(i-vtec|vtec)/i, delta: 12, reason: 'Honda VTEC petrol — extremely durable.' },
	{ re: /mazda\b.*\b(mzr|skyactiv)/i, delta: 8, reason: 'Mazda MZR / SkyActiv — generally reliable.' },
	{ re: /1\.0\s*tsi.*ea211|1\.2\s*tsi.*ea211/i, delta: 5, reason: 'VW EA211 TSI (post-2013) — fixed the timing chain issues.' },
	{ re: /1\.5\s*tdci|1\.6\s*tdci/i, delta: 2, reason: 'Ford 1.5/1.6 TDCi — refined PSA block, reasonably reliable.' },
	{ re: /1\.6\s*crdi/i, delta: 4, reason: 'Kia/Hyundai 1.6 CRDi (U2 / D4FB) — generally reliable Korean diesel, many units past 300k km; watch for EGR/DMF wear on early pre-2011 cars.' },
	{ re: /1\.3\s*(multijet|m[- ]?jet|jtd|cdti)/i, delta: -16, reason: 'Fiat/Opel 1.3 Multijet/JTD/CDTi — timing chain stretch 120–150k km, EGR/DPF clogs, turbo failures. Widely flagged as "motor a evitar".' },
	{ re: /1\.4\s*(hdi|tdci)/i, delta: -10, reason: 'PSA 1.4 HDi / Ford 1.4 TDCi — injector and FAP issues, oil sludge.' },
	{ re: /1\.6\s*tdi(?!.*ea288)/i, delta: -9, reason: 'VW 1.6 TDI common-rail (EA189) — injector/EGR issues, sensitive to urban use, DieselGate era.' },
	{ re: /1\.5\s*dci/i, delta: -5, reason: 'Renault 1.5 dCi (K9K) — mixed track record; early units plagued by injectors and turbo failure.' },
	{ re: /1\.6\s*dci/i, delta: -7, reason: 'Renault 1.6 dCi (R9M / Energy dCi) — timing chain stretch (pre-2015), oil consumption, injector and turbo failures; same block sold to Mercedes as OM626 with documented issues.' },
	{ re: /1\.6\s*hdi/i, delta: -4, reason: 'PSA 1.6 HDi — early units (pre-2010) had injector seal failures; FAP additive management needed.' },
	{ re: /2\.0\s*tdi.*(cbab|cbdb|cfgb)|2\.0\s*tdi.*pd/i, delta: -6, reason: '2.0 TDI PD / early CR — oil pump balance-shaft failures, FAP issues.' },
	{ re: /1\.2\s*tsi(?!.*ea211)/i, delta: -10, reason: 'VW 1.2 TSI (EA111, pre-2013) — timing chain stretch, tensioner failures.' },
	{ re: /1\.4\s*tsi/i, delta: -10, reason: 'VW 1.4 TSI — timing chain, carbon build-up, oil consumption.' },
	{ re: /1\.2\s*tdi/i, delta: -4, reason: 'VW 1.2 TDI 3-cyl — fragile in cold starts, DPF issues on short trips.' },
	{ re: /1\.4\s*tdi/i, delta: -7, reason: 'VW 1.4 TDI 3-cyl (PD / EA189 CR, pre-EA288) — DPF clogging on short trips, turbo failures from ~110k km, EGR coking; Dieselgate-era CR variants affected.' }
];

export const SCORE_WEIGHTS = { km: 0.22, price: 0.22, reliability: 0.3, year: 0.13, location: 0.13 };
