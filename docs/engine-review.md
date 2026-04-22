# Engine delta review

Working doc for reviewing `ENGINE_PROFILES` deltas in `src/lib/constants.ts:247-291`. Once proposals are agreed row-by-row, a follow-up PR lands the delta changes and re-pins fixtures.

## Context

An external critique (2026-04) argued:

1. **1.2 TDI 2010 is worse than 1.4 TDI** — yet current deltas are `1.2 TDI = -4`, `1.4 TDI = -7` (inverted).
2. **Viable alternatives**: 1.5 dCi, 1.4 HDi, 1.4 CRDi, 1.4 D-4D.
3. **Polos are overvalued** vs. a Leon from the segment above.
4. **"Diesel só 1.4 para cima"** — sub-1.4L diesels are uniformly problematic.

The critique is **one input, not ground truth**. This review weighs it against reliability databases (TÜV, Warranty Direct), long-term owner data (HonestJohn, PistonHeads, Auto Express), and dedicated engine-review sites (motorreviewer.com, enginedna.com). Where the evidence disagrees with the critique, the doc says so.

## Summary of proposed changes

**Corrections (critique-aligned):**
- **1.2 TDI** -4 → **-8** (evidence confirms it's worse than the 1.4 TDI 3-cyl — 460k-unit recall, injector/DPF/fuel-filter issues, Whatcar ranking 18/28).
- **1.4 D-4D** +18 → **+10** (the biggest misrating in the list: aluminum block that can't be rebored, 1ND-TV turbo failures documented; the legend is inherited from 2.0 D-4D, not earned by the 1ND).
- **1.6 TDCi** +2 → **-4** (same PSA DV6 block as 1.6 HDi; current +2 contradicts the -4 given to 1.6 HDi).
- **1.6 MZ-CD** +2 → **-4** (same story — same PSA DV6 block).

**New year splits:**
- **1.4 TDI**: 3-cyl PD pre-2010 -6, EA189 CR 2010–2014 -7, EA288 3-cyl rare post-2015 -2. Simplification: split at 2015 (pre-2015 -6, post-2015 -2).
- **1.5 dCi (K9K)**: pre-2011 early units -7, post-2011 (K9K 8xx series with DCM3.5/DCM6.2) -3.
- **1.6 HDi (DV6)**: pre-2011 16V DOHC -6, post-2011 8V SOHC DV6B -2.
- **Prince N12/N14/N18**: N12/N14 -10, N18 (2011+) -5.
- **OM651**: pre-2011 piezo-injector cars -8, post-2011 magnetic-injector cars -3.
- **N47**: add `yearMax: 2011` (affected window is Mar 2007 – Mar 2011).
- **2.2 D-4D head-gasket era**: pre-2010 2.2 D-4D (2AD-FTV) -2, post-2010 fix keeps +10.

**Small recalibrations:**
- **1.4 HDi / 1.4 TDCi** -10 → **-7** (DV4 block itself is durable, known for 300k+; the issues are ancillaries — injector seals, FAP — not engine-terminal).
- **1.4 CRDi (D4FC)** +3 → **+1** (fuel-pump failures 80–120k, DPF on short trips; solid but not notably better than neutral).

**Keep as-is (evidence confirms current):**
- 1.9 TDI +12, VVT-i +14, Honda VTEC +12, Mazda MZR/SkyActiv +8, 1.9 Multijet +10, Opel 1.7 CDTi +6, EA211 1.0/1.2 TSI (post-2014) +5, 1.6 CRDi (D4FB) +4, 1.6 TDI EA288 (post-2015) +2, 1.6 BlueHDi +2, 1.3 Multijet/DDiS -16, 1.2 TSI EA111 (pre-2014) -10, 1.4 TSI -10, 1.6 TDI EA189 (pre-2015) -9, Opel 1.4 Turbo A14NET -6, 1.0 EcoBoost (pre-2017) -6, 2.0 TDI PD/early CR -6, 1.6 dCi R9M -7, 0.9/1.2 TCe -8.

**Ordering implication:** adding year-split variants to engines that previously had a single rule (1.4 TDI, 1.5 dCi, 1.6 HDi, N18, OM651, 2.2 D-4D) means two entries for the same regex. Per `src/lib/scoring/reliability.ts:14-27` the first match wins, so the more specific (narrower year-bounded) rule must be listed **before** the catch-all.

## Review table

All 34 current entries, grouped by family. "Keep" = delta unchanged.

### Critique priority queue

| Engine | Fuel | Current | Proposal | Rationale | Sources |
|---|---|---|---|---|---|
| 1.2 TDI (VW 3-cyl CFWA, EA189 CR) | Diesel | -4 | **-8** | Critique-confirmed: 460k-car fuel-filter recall, documented injector/DPF/EGR issues on short trips, What Car? reliability 18/28 in class. Worse than the 1.4 TDI 3-cyl. | [motorreviewer](https://www.motorreviewer.com/engine.php?engine_id=46), [Autocar recall](https://www.autocar.co.uk/car-news/business/volkswagen-recalls-460000-cars-12-tdi-engine), [What Car? Polo 09-17](https://www.whatcar.com/volkswagen/polo/hatchback/used-review/n722/reliability) |
| 1.4 TDI (3-cyl PD / EA189 CR, pre-2015) | Diesel | -7 | **-6** (yearMax: 2014) | PD 3-cyl (2003–09) has better field rep than the CR EA189 3-cyl (2009–14). Keeping -6 averages the two; EA288 handled separately. Slightly less harsh than current -7. | [autopartswd TDI guide](https://autopartswd.com/volkswagen-tdi-engine-guide/), [motorreviewer 1.4 TDI EA288](https://www.motorreviewer.com/engine.php?engine_id=45), [HonestJohn EA189](https://www.honestjohn.co.uk/advice/owning-advice/ea189-engine-recall/) |
| 1.4 TDI EA288 (3-cyl, post-2015, rare) | Diesel | — | **-2** (yearMin: 2015) | New entry. Improved SCR/AdBlue injector system; EA288 family is noticeably more reliable than EA189. Few 3-cyl 1.4 EA288s sold — most later 1.4 TDIs are 4-cyl. | [motorreviewer EA288](https://www.motorreviewer.com/engine.php?engine_id=45) |
| 1.4 HDi (PSA DV4) / 1.4 TDCi | Diesel | -10 | **-7** | DV4 block itself can do 300–400k. Critique pushes back on -10, and evidence agrees: the issues are injector copper seals, FAP, EGR — expensive but not engine-terminal. -7 reflects the ancillary-cost risk without writing the block off. | [megaturbo](https://www.megaturbo.fr/blog/75-fiabilite-14-hdi), [Largus](https://www.largus.fr/actualite-automobile/fiabilite-les-problemes-du-14-hdi-68-ch-peugeotcitroen-6051384.html), [automotohebdo](https://automotohebdo.fr/fiabilite-moteur-1-4-hdi-70-avis/) |
| 1.5 dCi (K9K) pre-2011 | Diesel | -5 | **-7** (yearMax: 2010) | Early K9K had injector (Delphi) and turbo failures plus connecting-rod bearing issues from long oil intervals. Harsher than blanket -5. | [motorreviewer K9K](https://www.motorreviewer.com/engine.php?engine_id=21), [cararac](https://cararac.com/blog/renault-1-5-dci-engine-is-the-k9k-engine-efficient-or-problematic.html) |
| 1.5 dCi (K9K) post-2011 | Diesel | — | **-3** (yearMin: 2011) | New entry. K9K 8xx revisions (upgraded injectors, improved turbo oil feed) turned it into an adequate workhorse when serviced on synthetic RN0700/RN0710. | [cararac K9K](https://cararac.com/blog/renault-1-5-dci-engine-is-the-k9k-engine-efficient-or-problematic.html) |
| 1.4 CRDi (Hyundai/Kia D4FC) | Diesel | +3 | **+1** | Critique says "viable" — evidence: fuel pump at 80–120k, DPF on short trips, cold-start issues. Solid but not reliably better than a 60-baseline Korean make. +1 more honest than +3. | [autospruce D4FC](https://autospruce.com/kia-hyundai-1-4-crdi-d4fc-engine/), [mymotorlist D4FC](https://mymotorlist.com/engines/hyundai/d4fc/) |
| 1.4 D-4D (Toyota 1ND-TV) | Diesel | +18 | **+10** | **Biggest misrating in the list.** Aluminum block, overhaul with reboring not provided. Turbocharger problems documented. The "Toyota diesel = bulletproof" reputation belongs to 2.0 D-4D (1AD-FTV), not 1ND. Keeping it above petrol benchmarks at +10 is still generous. | [Wikipedia ND engine](https://en.wikipedia.org/wiki/Toyota_ND_engine), [Toyota Owners Club D4D](https://www.toyotaownersclub.com/forums/topic/113820-d4d-reliability-and-known-faults/), [mlfree](https://mlfree.com/en/toyota-1-4-d-4d-motor/?ao_noptimize=1) |

### VAG family (petrol + remaining diesels)

| Engine | Fuel | Current | Proposal | Rationale | Sources |
|---|---|---|---|---|---|
| 1.9 TDI (PD / ALH) | Diesel | +12 | **Keep** | Best-evidenced diesel in the list. 300k-mile units common; ALH simpler than PD but both top-tier. | [caffeinatedmotorist PD guide](https://caffeinatedmotorist.com/vw-1-9-tdi-pd-engine-guide-the-most-reliable-engine-of-all-time/), [autopartswd](https://autopartswd.com/volkswagen-tdi-engine-guide/) |
| 1.0/1.2 TSI EA211 (post-2014) | Gasolina | +5 | **Keep** | Belt-driven (90–120k interval) is a maintenance item, not a reliability flaw. EVO revisions from 2016+ further improved it. | [autopartswd EA211](https://autopartswd.com/volkswagen-ea211-engine-guide/) |
| 1.2 TSI EA111 (pre-2014) | Gasolina | -10 | **Keep** (yearMax: 2013) | 2010–11 worst; 2012 materially better; full redesign 2013/14. -10 still correct as blanket because buyers can't always tell which revision. | [motorreviewer EA111](https://www.motorreviewer.com/engine.php?engine_id=115), [SEATCUPRA.NET](https://www.seatcupra.net/forums/threads/1-2-tsi-timing-chain-failure-should-i-be-worried.424256/) |
| 1.4 TSI (twincharger CAVD/CAXA) | Gasolina | -10 | **Keep** | Timing chain tensioner at 100k; piston/ring failures on Golf-gen CAVD. CTHD (2012+) fixed most of it but unit is uncommon at €5k. | [VW Tuning 1.4 TSI](https://vwtuning.co/vw-1-4-tsi-engine-problems/), [grantwalker CAVD](https://grantwalker.com.au/volkswagen-cavd-engine-problems/) |
| 1.6 TDI EA189 (pre-2015) | Diesel | -9 | **Keep** (yearMax: 2014) | Siemens piezo injector insulation breakdown is the signature fault; Dieselgate emissions fix made EGR worse. | [carchecker Golf Mk6](https://www.carchecker.pro/reports/vw_golf_mk6_1.6_tdi.html), [HonestJohn EA189](https://www.honestjohn.co.uk/askhj/answer/71679/) |
| 1.6 TDI EA288 (post-2015) | Diesel | +2 | **Keep** (yearMin: 2015) | EGR/DPF/AdBlue maintenance items exist; bottom end is strong. +2 honest. | [enginedna EA288](https://www.enginedna.com/vw-turbodiesel-1-6tdi-ea288-reliability-and-problems/), [motorreviewer EA288](https://www.motorreviewer.com/engine.php?engine_id=44) |
| 2.0 TDI PD / early CR (BKP/BLB/BPW/BRE/BNA/BMA, CBAB/CBDB/CFGB) | Diesel | -6 | **Keep** | Oil-pump/balance-shaft failures 60–100k on "posh" VAG (Passat/A4/Superb). BKD/AZV/BMN (Golf/Octavia/A3) have chain-driven oil pump and are NOT affected — regex currently catches only PD + listed CR codes, which is correct. | [audi-sport.net](https://www.audi-sport.net/xf/threads/2-0tdi-oil-pump-balancer-shaft-problems-the-definitive-guide-audi-vw-skoda-seat.140949/), [mbservicesyorkshire](https://www.mbservicesyorkshire.co.uk/why-do-some-2-0pd-oil-drives-fail-and-others-dont/) |

### PSA + Ford (shared DV4/DV6 blocks)

| Engine | Fuel | Current | Proposal | Rationale | Sources |
|---|---|---|---|---|---|
| 1.4 MZ-CD (Mazda 2) | Diesel | -10 | **-7** | Same PSA DV4 as 1.4 HDi. Aligned with the 1.4 HDi adjustment. | same as 1.4 HDi |
| 1.5 TDCi (Ford EcoBlue, 2015+) | Diesel | +2 | **+2** (narrow to yearMin: 2015) | EcoBlue is a clean-sheet block, more reliable than the PSA DV6 it replaced. Needs a yearMin to stop the rule catching pre-2015 5-cyl TDCi variants (there aren't any, but tightens intent). | [CarInterior 1.5 TDCi](https://carinterior.alibaba.com/question/ford-1.5-tdci-engine-problems-explained) |
| 1.6 TDCi (Ford DLD-416 / PSA DV6) | Diesel | +2 (grouped with 1.5) | **-4** (split out) | Same PSA DV6 as 1.6 HDi; inconsistent for this to be +2 while 1.6 HDi is -4. Carbon-contamination turbo failure path is identical. Split regex: `1\.6\s*tdci` → -4, `1\.5\s*tdci` → +2. | [autotechnician 1.6 TDCi turbo](https://autotechnician.co.uk/workshop-repair-1-6-tdci-turbo-failure-heres-the-real-cause/), [pmmonline PSA 1.6 HDI](https://pmmonline.co.uk/technical/tackling-turbo-trouble-psa-1-6-hdi-engine/) |
| 1.6 MZ-CD (Mazda 3 BK/BL) | Diesel | +2 | **-4** | Same PSA DV6. Injectors before 130k; DPF contaminates oil. Aligned with 1.6 HDi / 1.6 TDCi. | [CarVerif Mazda 3 1.6 MZ-CD](https://carverif.fr/blogs/fiabilite-voitures/mazda-3-bk-diesel-1-6-mz-cd-109ch-fiabilite-perfs) |
| 1.6 HDi (PSA DV6 TED4, pre-2011) | Diesel | -4 | **-6** (yearMax: 2010) | 16V DOHC pre-2010/11 is the problem variant (injector carbon leakage → turbo failure). Current blanket -4 is too lenient for this era. | [pmmonline DV6 turbo](https://pmmonline.co.uk/technical/tackling-turbo-trouble-psa-1-6-hdi-engine/), [frenchcarforum](https://frenchcarforum.co.uk/forum/viewtopic.php?t=42948) |
| 1.6 HDi (PSA DV6B, post-2011) | Diesel | — | **-2** (yearMin: 2011) | New entry. 8V SOHC DV6B from 2010/11 is re-engineered and addresses the injector seal / turbo oiling problems. | [peugeotforums](https://www.peugeotforums.com/threads/the-1-6hdi-engine-reliability-now.27745/) |
| 1.6 BlueHDi (DV5/DV6FC, post-2014) | Diesel | +2 | **Keep** | Bottom end is strong; AdBlue/SCR/NOx-sensor failures push ownership cost up but rarely kill the engine. | [carchecker C4 1.6 BlueHDi](https://www.carchecker.pro/reports/citroen_c4_mk2_1.6_bluehdi.html), [adblue-services PSA](https://www.adblue-services.com/en/adblue-psa/) |
| 1.0 EcoBoost (Ford, pre-2017) | Gasolina | -6 | **Keep** (yearMax: 2016) | Wet-belt degradation is a €1000+ repair on a €5k-tier car. Fix landed in 2018 with chain-drive; pre-2017 -6 stands. | [parkers wet belt](https://www.parkers.co.uk/car-news/ford/ford-wet-belt-issues/), [tgpp-autocare timeline](https://www.tgpp-autocare.com/blog/2689987_when-did-ford-1-0-ecoboost-engines-stop-using-wetbelts) |

### Renault-Nissan

| Engine | Fuel | Current | Proposal | Rationale | Sources |
|---|---|---|---|---|---|
| 0.9/1.2 TCe (H4Bt / H5Ft) | Gasolina | -8 | **Keep** | Piston-ring tolerance defect on H5Ft consumes 1L/1000km in affected units; repair €500–1500 plus consequential damage. -8 is honest. | [motoranimal H4Bt](https://motoranimal.com/renault-0-9-tce-engine-problems-and-durability/), [diagnosedan 1.2 TCe](https://www.diagnosedan.com/renault-1-2-tce-burned-exhaust-valves-diagnosis/), [carchecker Captur 1.2 TCe](https://www.carchecker.pro/reports/renault_captur_mk1_1.2_tce.html) |
| 1.6 dCi R9M (Energy dCi) | Diesel | -7 | **Keep** | Timing chain stretch 140–150k against a 250k design target, dual-EGR clogging, oil leaks around chain cover. OM626 (Mercedes) inherits the issues. | [motorreviewer R9M](https://www.motorreviewer.com/engine.php?engine_id=51), [frenchcarforum R9M](https://frenchcarforum.co.uk/forum/viewtopic.php?t=76276) |

### BMW / Mini / Mercedes

| Engine | Fuel | Current | Proposal | Rationale | Sources |
|---|---|---|---|---|---|
| Prince N12/N14 / 1.6 THP | Gasolina | -10 | **Keep** | R56 Mini / 207 THP / DS3 era. Timing chain stretch ("death rattle"), direct-injection carbon build-up, water pump failures. -10 matches the evidence. | [apexxengines N14](https://apexxengines.co.uk/ford-ecoboost-wet-belt-failing-signs/) (general), [cherishyourcar](https://www.cherishyourcar.com/mini-cooper-timing-chain-recall/), [mini2 N12-N14-N18](https://www.mini2.com/threads/n12-n14-n18-common-issues.326570/) |
| Prince N18 (2011+) | Gasolina | — | **-5** (new rule with yearMin: 2011, `\bn18\b`) | N18 addressed the N14 timing chain, vacuum pump and coking issues. Still direct-injection (some carbon build-up expected) so not neutral, but clearly better than N12/N14. | [lohen N14 vs N18](https://www.lohen.co.uk/blogs/blog/how-do-the-n14-n18-mini-cooper-engines-compare), [mini2 N14 vs N18](https://www.mini2.com/threads/n14-vs-n18.359922/) |
| N47 2.0d (pre-2011) | Diesel | -8 | **-10** (add yearMax: 2011) | Worst window Mar 2007 – Jan 2009; full affected Mar 2007 – Mar 2011. Chain at rear of block → engine-out repair £1500–6500. Add the year bound so the rule doesn't hit post-2011 320d (B47 era). | [enginefinders N47 cost](https://enginefinders.co.uk/blog/bmw-n47-timing-chain-failure-uk-engine-replacement-cost-guide-e90-f30bmw-n47-timing-chain-failure-uk-engine-replacement-cost-guide-e90-f30/), [automotorblog N47D20](https://www.automotorblog.com/bmw-n47-engine-n47d20-timing-chain-failure-problems-112033.html) |
| OM651 2.1 CDI (pre-2011 piezo injectors) | Diesel | -6 | **-8** (add yearMax: 2010) | Delphi piezo injectors are the signature failure mode pre-mid-2010. Harsher than current -6 to reflect the cost. | [mercedesassistance OM651](https://en.mercedesassistance.com/om651-mercedes-engine/), [speedme OM651](https://speedme.ru/en/posts/id16717-mercedes-om651-diesel-engine-common-problems-reliability) |
| OM651 2.1 CDI (post-2011 magnetic injectors) | Diesel | — | **-3** (new rule with yearMin: 2011) | Magnetic injectors (Delphi) from spring 2011 resolve the worst failure mode. Timing chain and hydraulic tensioner issues remain, hence still negative. | [carsuk BlueEfficiency injectors](https://www.carsuk.net/mercedes-blueefficiency-om651-injector-problems/) |

### Opel / GM

| Engine | Fuel | Current | Proposal | Rationale | Sources |
|---|---|---|---|---|---|
| Opel 1.7 CDTi (Isuzu Y17DT/A17DTJ) | Diesel | +6 | **Keep** | "Most reliable GM diesel", 200k+km common, Isuzu block with solid reputation. EGR/swirl-flap the main watch-points. | [Wikipedia Circle L](https://en.wikipedia.org/wiki/Circle_L_engine), [pistonheads 1.7 CDTi](https://www.pistonheads.com/gassing/topic.asp?h=0&f=104&t=1477976), [vauxhallownersnetwork Isuzu](https://www.vauxhallownersnetwork.co.uk/threads/which-astras-had-the-reliable-isuzu-engine-installed.413920/) |
| Opel 1.4 Turbo (A14NET/B14NET) | Gasolina | -6 | **Keep** | Timing chain stretch documented at low mileage (20k–40k miles on some Corsas). Soot-in-oil accelerates it. | [cruzetalk A14NET](https://www.cruzetalk.com/threads/timing-chain-1-4l-turbo-a14net.238923/) |

### Korean

| Engine | Fuel | Current | Proposal | Rationale | Sources |
|---|---|---|---|---|---|
| 1.6 CRDi (Hyundai/Kia D4FB U2) | Diesel | +4 | **Keep** | 250k km typical; timing chain, bottom end solid; Bosch injectors wear 120–180k is the main cost. Euro 6 D4FE adds AdBlue complexity but still fundamentally dependable. | [enginedna D4FB](https://www.enginedna.com/kia-and-hyundai-1-6-crdi-d4fb-engine/), [carchecker i30 PD](https://www.carchecker.pro/reports/hyundai_i30_pd_1.6_crdi.html) |

### Italian

| Engine | Fuel | Current | Proposal | Rationale | Sources |
|---|---|---|---|---|---|
| 1.3 Multijet/JTD/CDTi (Fiat / Opel) | Diesel | -16 | **Keep** | Timing chain stretch 120–150k sensitive to oil level, urban-use prone. -16 is appropriate for a well-documented "motor a evitar". | [Carooline JTD chain](https://media.carooline.com/media/0350_DOC/TimingCainMultijet_GB.PDF), [fiatforum 1.3 chain](https://www.fiatforum.com/threads/should-i-get-timing-chain-replaced-on-1-3-multijet.318962/) |
| 1.3 DDiS (Suzuki, licensed Multijet) | Diesel | -16 | **-14** | Same block under Suzuki licence. Owner surveys marginally better than Fiat (4.6 vs 4.3 on reliability), probably reflecting lighter/less-stressed installations. Marginal softening. | [fiatforum Suzuki 1.3](https://www.fiatforum.com/threads/suzuki-swift-1-3-ddis-the-verdict.177444/), [HonestJohn Suzuki](https://www.honestjohn.co.uk/askhj/answer/50054/is-the-fiat-diesel-engine-fitted-to-the-suzuki-swift-reliable-) |
| 1.9 Multijet / JTD (Fiat / Alfa) | Diesel | +10 | **Keep** | 200–250k units common when serviced. 8V variant (water pump off aux belt, not cam belt) preferred. | [alfaowner JTDM story](https://www.alfaowner.com/threads/1-9-jtd-1-9-jtdm-engine-story.405729/), [automaniac Fiat 1.9 JTD 115](https://www.automaniac.org/blog/9/popular-engines-fiat-1.9-jtd-115) |

### Japanese (non-PSA)

| Engine | Fuel | Current | Proposal | Rationale | Sources |
|---|---|---|---|---|---|
| 2.0/2.2 D-4D (Toyota 1AD-FTV / 2AD-FTV) | Diesel | +10 | **+10** (1AD); **split** 2AD pre-2010 -2 / 2AD post-2010 +7 | 2.0 D-4D (1AD-FTV) is the legend. 2.2 D-4D (2AD-FTV) 2005–2008 is notorious for head-gasket failures — Toyota replaced gaskets with stronger material in 2010+. The current single rule catching both over-rates pre-2010 2.2. Implementation-wise: add a narrower rule first for `2\.2\s*d[- ]?4d` with `yearMax: 2009` → -2; keep broad rule (+10) after. | [cararac 2.2 D4D](https://cararac.com/blog/toyota-2-2-d4d-engine-problems-durability-facts.html), [myenginespecs D4D](https://myenginespecs.com/toyota/toyota-d4d-engine-problems-recalls-and-tsbs/) |
| VVT-i (Toyota, 1NZ-FE et al.) | Gasolina | +14 | **Keep** | Bulletproof up to 100k mi; after 100k oil consumption and timing chain stretch appear but rarely terminal. +14 still fair given €5k cars typically have 120–200k km. | [motorreviewer 1NZ-FE](https://www.motorreviewer.com/engine.php?engine_id=170), [primeautoengines](https://primeautoengines.com/toyota-1nz-fe-engine-reliability-and-lifespan-why-its-still-a-smart-buy/) |
| Honda i-VTEC / VTEC (R18A, L13A, K20, K24) | Gasolina | +12 | **Keep** | R18A oil consumption after 100k is the caveat; L13A is essentially bulletproof (chain, not belt). +12 average across the family. | [motorreviewer R18A](https://www.motorreviewer.com/engine.php?engine_id=83), [engineexplained L13A](https://www.engineexplained.com/honda-l13a-1-3l-engine-review-and-insights/) |
| Mazda MZR / SkyActiv | any | +8 | **Keep** | SkyActiv-G 2.0/2.5 "near bulletproof" per owner data; MAF sensor and carbon build-up minor. Note: early 2.2 SkyActiv-D has DPF/oil-dilution issues but that's a separate regex the current rule doesn't affect. | [slashgear SkyActiv](https://www.slashgear.com/2002995/mazda-skyactiv-engine-reliability-what-owners-say/), [motorreviewer 2.0 SkyActiv-G](https://www.motorreviewer.com/engine.php?engine_id=95) |

## Policy decisions

**Diesel <1.4L blanket rule: rejected.** Every common sub-1.4 diesel in the Portuguese market is already named (1.2 TDI, 1.3 Multijet, 1.3 DDiS). A blanket rule would either double-penalise these or be dead code. Per-engine keeps the rationale legible and avoids punishing the rare good small diesel (none currently exist at €5k).

**Year splits added:** 1.4 TDI (yearMax 2014 vs yearMin 2015), 1.5 dCi (yearMax 2010 vs yearMin 2011), 1.6 HDi (yearMax 2010 vs yearMin 2011), N18 (yearMin 2011), OM651 (yearMax 2010 vs yearMin 2011), 2.2 D-4D (yearMax 2009). N47 gains a `yearMax: 2011` to avoid catching the B47 successor.

**Polo-vs-Leon pricing critique: out of scope.** This is a market-segment valuation argument, not an engine-reliability one. It belongs in `priceSubscore` (`src/lib/scoring/price.ts`) — either a segment-aware price anchor or a make/model adjustment layer — and not in `ENGINE_PROFILES`. Tracked as a follow-up, not addressed in this PR.

**Ordering rule for `reliability.ts`:** the `getEngineProfile` loop returns the first match. Any narrower (year-bounded) rule for a family must be listed **above** the catch-all. The new 1.5 dCi, 1.6 HDi, N18, OM651 and 2.2 D-4D splits all need this care.

## Follow-up PR checklist

1. Edit `src/lib/constants.ts:247-291` applying the proposals above.
2. Verify year-split ordering in `ENGINE_PROFILES` (narrower rule first — `src/lib/scoring/reliability.ts:14-27` first-match semantics).
3. Re-pin score fixtures: `npx tsx --env-file=.env scripts/capture-baselines.mjs`.
4. Run `npm run check && npm test` — investigate any unexpected drift in `tests/scoring/index.test.ts` before accepting new fixtures.
5. Spot-check live data: run `/list`, sort by score, sanity-check that the corrected engines moved in the expected direction (e.g. a Polo 1.2 TDI 2010 should rank lower than an equivalent Golf 1.4 TDI 2010).

## Out of scope (follow-ups to track separately)

- Polo-vs-Leon segment pricing (new signal or `priceSubscore` adjustment).
- `MAKE_RELIABILITY` baselines — only engine deltas reviewed here.
- 2.2 SkyActiv-D split (DPF/oil-dilution on early units) — relevant if diesel Mazda listings ever appear at this budget.
