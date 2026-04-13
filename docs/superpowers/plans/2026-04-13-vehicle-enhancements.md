# Vehicle Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add URL auto-inference, a location field, list view URL icons, pipeline drag-and-drop, staleness auto-transitions (sem-resposta/inativo), make/model comboboxes, icon-only list actions, and fix the Add button styling.

**Architecture:** All frontend changes are in the single monolithic `index.html` (CSS + HTML + JS). Backend changes are in `server.js`. No new files are needed. Changes follow the existing patterns in both files.

**Tech Stack:** Vanilla JS, HTML5 DnD API, HTML5 `<datalist>`, Express.js, file-based JSON persistence.

---

## File Map

| File | What changes |
|------|-------------|
| `server.js` | Add `location`, `contactedAt` to POST; add `location` to PUT fields list; set `contactedAt` on status→contacted; add staleness auto-transition in GET |
| `index.html` (CSS, lines 10–429) | New pipeline column colors, drag-over styles, icon button styles, status badge colors, datalist feedback styles, fix `.btn-add` |
| `index.html` (HTML, lines 431–611) | Update status `<select>` options in modal and filter bars; add location `<input>`; change make/model to `<input list>` + `<datalist>` |
| `index.html` (JS, lines 613–1052) | Update `STATUSES`; update `computeScore`; add `inferFromUrl`; update `cardHTML`; update `renderPipeline`; update `renderList`; update `openDetail`; update `openModal` + `handleSubmit` |

---

## Task 1: Update `server.js` — new fields + staleness auto-transitions

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Replace the GET handler with staleness auto-transition logic**

Replace lines 20–22 in `server.js`:
```js
// OLD
app.get('/api/cars', (req, res) => {
  res.json(readData());
});
```
With:
```js
app.get('/api/cars', (req, res) => {
  const cars = readData();
  const now = Date.now();
  let dirty = false;

  cars.forEach(car => {
    if (!car.contactedAt) return;
    const contactedMs = new Date(car.contactedAt).getTime();
    const daysSinceContact = (now - contactedMs) / (1000 * 60 * 60 * 24);

    // Two separate ifs (not else-if): if a car wasn't loaded for 5+ days,
    // it transitions directly from 'contacted' to 'inativo' in one GET call.
    if (car.status === 'contacted' && daysSinceContact >= 3) {
      car.status = 'sem-resposta';
      dirty = true;
    }
    if (car.status === 'sem-resposta' && daysSinceContact >= 5) {
      car.status = 'inativo';
      dirty = true;
    }
  });

  if (dirty) writeData(cars);
  res.json(cars);
});
```

- [ ] **Step 2: Add `location` and `contactedAt` to the POST handler**

Replace the `car` object literal in `app.post` (lines 26–43):
```js
  const car = {
    id: String(Date.now()),
    addedAt: new Date().toISOString(),
    url: req.body.url || '',
    title: req.body.title || '',
    make: req.body.make || '',
    model: req.body.model || '',
    year: Number(req.body.year) || 0,
    km: Number(req.body.km) || 0,
    price: Number(req.body.price) || 0,
    fuel: req.body.fuel || '',
    source: req.body.source || '',
    status: req.body.status || 'to-contact',
    location: req.body.location || '',
    contactedAt: req.body.status === 'contacted' ? new Date().toISOString() : null,
    notes: req.body.notes || '',
    priceHistory: [
      { date: new Date().toISOString(), price: Number(req.body.price) || 0, note: 'Initial price' }
    ]
  };
```

- [ ] **Step 3: Update the PUT handler to handle `location` and `contactedAt`**

Replace the `fields` array on line 66:
```js
// OLD
const fields = ['url', 'title', 'make', 'model', 'year', 'km', 'price', 'fuel', 'source', 'status', 'notes'];
```
With:
```js
const fields = ['url', 'title', 'make', 'model', 'year', 'km', 'price', 'fuel', 'source', 'status', 'location', 'notes'];
```

Then, after the `for` loop (after `car[f] = ...`), add the `contactedAt` logic (insert before `delete car.priceNote;`):
```js
  // Set contactedAt when status first moves to 'contacted'
  if (req.body.status === 'contacted' && !car.contactedAt) {
    car.contactedAt = new Date().toISOString();
  }
```

- [ ] **Step 4: Start the server and verify it runs**

```bash
cd "/Users/pedrorocha/Documents/Personal Projects/car-organizer"
node server.js
```
Expected: `Car Tracker running on http://localhost:3000`

- [ ] **Step 5: Commit**

```bash
git add server.js
git commit -m "feat: add location, contactedAt, and staleness auto-transitions to server"
```

---

## Task 2: Update `STATUSES` constant and `computeScore` in JS

**Files:**
- Modify: `index.html` (JS section, lines 621–649)

- [ ] **Step 1: Replace the `STATUSES` array (line 621–629)**

```js
// OLD
const STATUSES = [
  { key: 'to-contact', label: 'To Contact' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'visit-scheduled', label: 'Visit Scheduled' },
  { key: 'visited', label: 'Visited' },
  { key: 'negotiating', label: 'Negotiating' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'bought', label: 'Bought' }
];
```
With:
```js
const STATUSES = [
  { key: 'to-contact', label: 'To Contact' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'sem-resposta', label: 'Sem Resposta' },
  { key: 'inativo', label: 'Inativo' },
  { key: 'negotiating', label: 'Negociação' },
  { key: 'rejected', label: 'Rejeitado' },
  { key: 'bought', label: 'Comprado' }
];
```

- [ ] **Step 2: Update `computeScore` — remove references to removed statuses (lines 638–643)**

```js
// OLD
  let statusScore = 0;
  if (car.status === 'visited') statusScore = 50;
  else if (car.status === 'negotiating') statusScore = 100;
```
With:
```js
  let statusScore = 0;
  if (car.status === 'negotiating') statusScore = 100;
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: update STATUSES — remove visit-scheduled/visited, add sem-resposta/inativo"
```

---

## Task 3: Update CSS — new pipeline colors, drag-over, icon buttons, btn-add fix

**Files:**
- Modify: `index.html` (CSS section, lines 421–428)

- [ ] **Step 1: Replace pipeline column color accents (lines 421–428)**

```css
/* OLD */
.pipeline-col[data-status="to-contact"] .pipeline-col-header { border-left: 3px solid var(--text-muted); padding-left: 13px; }
.pipeline-col[data-status="contacted"] .pipeline-col-header { border-left: 3px solid var(--blue); padding-left: 13px; }
.pipeline-col[data-status="visit-scheduled"] .pipeline-col-header { border-left: 3px solid #9B6DD7; padding-left: 13px; }
.pipeline-col[data-status="visited"] .pipeline-col-header { border-left: 3px solid var(--yellow); padding-left: 13px; }
.pipeline-col[data-status="negotiating"] .pipeline-col-header { border-left: 3px solid #E8873A; padding-left: 13px; }
.pipeline-col[data-status="rejected"] .pipeline-col-header { border-left: 3px solid var(--red); padding-left: 13px; }
.pipeline-col[data-status="bought"] .pipeline-col-header { border-left: 3px solid var(--green); padding-left: 13px; }
```
With:
```css
.pipeline-col[data-status="to-contact"] .pipeline-col-header { border-left: 3px solid var(--text-muted); padding-left: 13px; }
.pipeline-col[data-status="contacted"] .pipeline-col-header { border-left: 3px solid var(--blue); padding-left: 13px; }
.pipeline-col[data-status="sem-resposta"] .pipeline-col-header { border-left: 3px solid var(--yellow); padding-left: 13px; }
.pipeline-col[data-status="inativo"] .pipeline-col-header { border-left: 3px solid #8B3A2A; padding-left: 13px; }
.pipeline-col[data-status="negotiating"] .pipeline-col-header { border-left: 3px solid #E8873A; padding-left: 13px; }
.pipeline-col[data-status="rejected"] .pipeline-col-header { border-left: 3px solid var(--red); padding-left: 13px; }
.pipeline-col[data-status="bought"] .pipeline-col-header { border-left: 3px solid var(--green); padding-left: 13px; }
```

- [ ] **Step 2: Add drag-over, icon button, status badge, and inferred field CSS**

Add the following block right after line 428 (after the pipeline column CSS, before `</style>`):
```css
/* Drag-and-drop */
.pipeline-col.drag-over { outline: 2px dashed var(--accent); background: rgba(12,110,93,0.04); }
.car-card[draggable="true"] { cursor: grab; }
.car-card[draggable="true"]:active { cursor: grabbing; opacity: 0.8; }

/* Icon action buttons */
.icon-btn {
  background: none; border: none; color: var(--text-muted);
  padding: 5px 7px; border-radius: var(--radius-sm);
  font-size: 0.9rem; line-height: 1; transition: all 0.15s;
  display: inline-flex; align-items: center; justify-content: center;
}
.icon-btn:hover { background: var(--bg-warm); color: var(--text); }
.icon-btn svg { width: 14px; height: 14px; pointer-events: none; }

/* Status badge staleness colors */
.status-badge.sem-resposta { background: var(--yellow-bg); color: var(--yellow); }
.status-badge.inativo { background: var(--red-bg); color: #8B3A2A; }

/* Inferred field highlight */
.field-inferred { border-left: 2px solid var(--accent) !important; }
```

- [ ] **Step 3: Fix `.btn-add` styling (lines 87–94)**

```css
/* OLD */
.btn-add {
  background: var(--accent); border: none; color: #fff;
  width: 36px; height: 36px; border-radius: 10px;
  font-size: 1.2rem; font-weight: 400;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(12,110,93,0.25);
}
```
With:
```css
.btn-add {
  background: var(--accent); border: none; color: #fff;
  padding: 0 16px; height: 36px; border-radius: 10px;
  font-size: 0.84rem; font-weight: 700; letter-spacing: -0.01em;
  display: inline-flex; align-items: center; gap: 6px;
  transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(12,110,93,0.25);
  white-space: nowrap;
}
```

- [ ] **Step 4: Update the Add button HTML (line 441) to use text label**

```html
<!-- OLD -->
<button class="btn-add" onclick="openModal()" title="Add car">+</button>
```
With:
```html
<button class="btn-add" onclick="openModal()">+ Add Car</button>
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "fix: update pipeline colors, add DnD/icon/badge CSS, fix Add button styling"
```

---

## Task 4: Update HTML form — location field, make/model comboboxes, status dropdowns

**Files:**
- Modify: `index.html` (HTML section, lines 524–610)

- [ ] **Step 1: Add `<datalist>` elements for make and model after the `</style>` tag (insert before `<div class="header">`)**

Insert after line 430 (`</style>`) and before `</head>` (line 430, after `</style>` and before `</head>`):
```html
<datalist id="makes-list">
  <option value="Audi">
  <option value="BMW">
  <option value="Citroën">
  <option value="Dacia">
  <option value="Fiat">
  <option value="Ford">
  <option value="Honda">
  <option value="Hyundai">
  <option value="Kia">
  <option value="Mazda">
  <option value="Mercedes-Benz">
  <option value="Mitsubishi">
  <option value="Nissan">
  <option value="Opel">
  <option value="Peugeot">
  <option value="Renault">
  <option value="Seat">
  <option value="Skoda">
  <option value="Suzuki">
  <option value="Toyota">
  <option value="Volkswagen">
  <option value="Volvo">
</datalist>
<datalist id="models-list"></datalist>
```

- [ ] **Step 2: Replace the Make/Model inputs with comboboxes (lines 537–546)**

```html
<!-- OLD -->
      <div class="form-row">
        <div class="form-group">
          <label>Make</label>
          <input type="text" id="form-make" placeholder="e.g. Renault">
        </div>
        <div class="form-group">
          <label>Model</label>
          <input type="text" id="form-model" placeholder="e.g. Clio">
        </div>
      </div>
```
With:
```html
      <div class="form-row">
        <div class="form-group">
          <label>Make</label>
          <input type="text" id="form-make" list="makes-list" placeholder="e.g. Renault" autocomplete="off">
        </div>
        <div class="form-group">
          <label>Model</label>
          <input type="text" id="form-model" list="models-list" placeholder="e.g. Clio" autocomplete="off">
        </div>
      </div>
```

- [ ] **Step 3: Add the Location field after the Source/Status row in the form**

After the Source/Status `</div>` closing tag (line 596, after `</div>` that closes the form-row), insert:
```html
      <div class="form-group">
        <label>Localização</label>
        <input type="text" id="form-location" placeholder="e.g. Lisboa, Porto">
      </div>
```

- [ ] **Step 4: Update the Status `<select>` in the form (lines 586–595) — remove visit-scheduled/visited**

```html
<!-- OLD -->
          <select id="form-status">
            <option value="to-contact">To Contact</option>
            <option value="contacted">Contacted</option>
            <option value="visit-scheduled">Visit Scheduled</option>
            <option value="visited">Visited</option>
            <option value="negotiating">Negotiating</option>
            <option value="rejected">Rejected</option>
            <option value="bought">Bought</option>
          </select>
```
With:
```html
          <select id="form-status">
            <option value="to-contact">To Contact</option>
            <option value="contacted">Contacted</option>
            <option value="sem-resposta">Sem Resposta</option>
            <option value="inativo">Inativo</option>
            <option value="negotiating">Negociação</option>
            <option value="rejected">Rejeitado</option>
            <option value="bought">Comprado</option>
          </select>
```

- [ ] **Step 5: Update `list-status-filter` dropdown (lines 481–490) — remove visit-scheduled/visited**

```html
<!-- OLD -->
  <select id="list-status-filter">
    <option value="">All Statuses</option>
    <option value="to-contact">To Contact</option>
    <option value="contacted">Contacted</option>
    <option value="visit-scheduled">Visit Scheduled</option>
    <option value="visited">Visited</option>
    <option value="negotiating">Negotiating</option>
    <option value="rejected">Rejected</option>
    <option value="bought">Bought</option>
  </select>
```
With:
```html
  <select id="list-status-filter">
    <option value="">All Statuses</option>
    <option value="to-contact">To Contact</option>
    <option value="contacted">Contacted</option>
    <option value="sem-resposta">Sem Resposta</option>
    <option value="inativo">Inativo</option>
    <option value="negotiating">Negociação</option>
    <option value="rejected">Rejeitado</option>
    <option value="bought">Comprado</option>
  </select>
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add location field, make/model datalists, update status dropdowns in form and filters"
```

---

## Task 5: Add `inferFromUrl` function and model datalist population

**Files:**
- Modify: `index.html` (JS section — add after `const STATUS_LABELS = ...` line ~631)

- [ ] **Step 1: Add `inferFromUrl` function after `STATUS_LABELS` declaration**

Insert after `const STATUS_LABELS = Object.fromEntries(STATUSES.map(s => [s.key, s.label]));` (line ~631):

```js
// --- URL Inference ---
const SOURCE_MAP = {
  'standvirtual.com': 'StandVirtual',
  'autoscout24.pt': 'AutoScout24',
  'olx.pt': 'OLX',
  'facebook.com': 'Facebook Marketplace',
  'piscapisca.pt': 'PiscaPisca'
};

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

function inferFromUrl(url) {
  if (!url) return;
  let parsed;
  try { parsed = new URL(url); } catch { return; }

  const hostname = parsed.hostname.replace(/^www\./, '');
  const sourceField = document.getElementById('form-source');
  const makeField = document.getElementById('form-make');
  const modelField = document.getElementById('form-model');

  // Source from domain
  const inferredSource = SOURCE_MAP[hostname];
  if (inferredSource && !sourceField.value) {
    sourceField.value = inferredSource;
    sourceField.classList.add('field-inferred');
  }

  // Make/Model from URL path
  let make = '', model = '';
  const parts = parsed.pathname.toLowerCase().split('/').filter(Boolean);

  if (hostname === 'standvirtual.com' && parts[0] === 'anuncios' && parts[1]) {
    // e.g. /anuncios/volkswagen-polo-something/
    const segments = parts[1].split('-');
    make = capitalize(segments[0]);
    model = capitalize(segments[1] || '');
  } else if (hostname === 'autoscout24.pt') {
    // e.g. /pt/carros/volkswagen/polo/
    const carrosIdx = parts.indexOf('carros');
    if (carrosIdx !== -1 && parts[carrosIdx + 1]) {
      make = capitalize(parts[carrosIdx + 1]);
      model = capitalize(parts[carrosIdx + 2] || '');
    }
  } else if (parts[0]) {
    // Generic: first path segment, split on '-'
    const segments = parts[0].split('-');
    make = capitalize(segments[0]);
    model = capitalize(segments[1] || '');
  }

  if (make && !makeField.value) {
    makeField.value = make;
    makeField.classList.add('field-inferred');
  }
  if (model && !modelField.value) {
    modelField.value = model;
    modelField.classList.add('field-inferred');
  }

  // Update model datalist for the inferred make
  updateModelDatalist(make || makeField.value);
}

function updateModelDatalist(make) {
  const dl = document.getElementById('models-list');
  if (!make) { dl.innerHTML = ''; return; }
  const models = [...new Set(
    cars.filter(c => c.make && c.make.toLowerCase() === make.toLowerCase() && c.model)
        .map(c => c.model)
  )].sort();
  dl.innerHTML = models.map(m => `<option value="${esc(m)}">`).join('');
}
```

- [ ] **Step 2: Wire up the URL field and make field events**

In the section after `// --- Init ---` (near the bottom of the `<script>`, before `fetchCars();`), add:

```js
// URL inference
document.getElementById('form-url').addEventListener('blur', e => inferFromUrl(e.target.value));

// Clear inferred class on focus + update model datalist on make change
['form-make', 'form-model', 'form-source'].forEach(id => {
  document.getElementById(id).addEventListener('focus', e => e.target.classList.remove('field-inferred'));
});
document.getElementById('form-make').addEventListener('input', e => updateModelDatalist(e.target.value));
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add URL auto-inference for source and make/model"
```

---

## Task 6: Update `cardHTML` and `renderPipeline` — location + drag-and-drop

**Files:**
- Modify: `index.html` (JS, `cardHTML` ~lines 689–712, `renderPipeline` ~lines 727–740)

- [ ] **Step 1: Update `cardHTML` — add location, draggable, dragstart**

Replace the `cardHTML` function (lines 689–712):
```js
function cardHTML(car) {
  const score = computeScore(car);
  const sc = scoreClass(score);
  const notesPreview = car.notes ? (car.notes.length > 80 ? car.notes.slice(0, 80) + '...' : car.notes) : '';
  const compareActive = selectedForCompare.has(car.id) ? ' compare-active' : '';
  return `<div class="car-card" onclick="openDetail('${car.id}')" data-id="${car.id}"
      draggable="true"
      ondragstart="event.dataTransfer.setData('carId','${car.id}');event.stopPropagation()">
    <div class="card-header">
      <span class="card-title">${esc(car.title)}</span>
      ${car.source ? `<span class="source-tag">${esc(car.source)}</span>` : ''}
    </div>
    <div class="card-chips">
      <span class="chip">${car.year || '\u2014'}</span>
      <span class="chip">${car.km ? car.km.toLocaleString() + ' km' : '\u2014'}</span>
      <span class="chip">${car.fuel || '\u2014'}</span>
      <span class="chip chip-price">\u20AC${car.price ? car.price.toLocaleString() : '\u2014'}</span>
      <span class="chip chip-score ${sc}">${score}</span>
    </div>
    ${car.location ? `<div class="card-notes" style="margin-bottom:6px;">📍 ${esc(car.location)}</div>` : ''}
    ${notesPreview ? `<div class="card-notes">${esc(notesPreview)}</div>` : ''}
    <div class="card-actions">
      <button class="card-btn" onclick="event.stopPropagation();openModal('${car.id}')">Edit</button>
      <button class="card-btn${compareActive}" onclick="event.stopPropagation();toggleCompare('${car.id}')">Compare</button>
    </div>
  </div>`;
}
```

- [ ] **Step 2: Update `renderPipeline` — add DnD event handlers on columns**

Replace `renderPipeline` (lines 727–740):
```js
function renderPipeline() {
  const fuel = document.getElementById('pipeline-fuel-filter').value;
  const source = document.getElementById('pipeline-source-filter').value;
  const filtered = filterCars(cars, 'pipeline-search', fuel, source);

  const el = document.getElementById('pipeline-view');
  el.innerHTML = STATUSES.map(s => {
    const colCars = filtered.filter(c => c.status === s.key);
    return `<div class="pipeline-col" data-status="${s.key}"
        ondragover="event.preventDefault();this.classList.add('drag-over')"
        ondragleave="this.classList.remove('drag-over')"
        ondrop="this.classList.remove('drag-over');handleDrop(event,this)">
      <div class="pipeline-col-header">${s.label} <span class="count-badge">${colCars.length}</span></div>
      <div class="pipeline-col-body">${colCars.length ? colCars.map(cardHTML).join('') : '<div class="empty-state"><div class="empty-state-icon">\u2015</div>No cars</div>'}</div>
    </div>`;
  }).join('');
}
```

- [ ] **Step 3: Add `handleDrop` function after `renderPipeline`**

Insert immediately after the closing `}` of `renderPipeline`:
```js
function handleDrop(event, col) {
  const id = event.dataTransfer.getData('carId');
  const newStatus = col.dataset.status;
  if (!id || !newStatus) return;
  updateCar(id, { status: newStatus });
}
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add location to pipeline cards, implement HTML5 drag-and-drop"
```

---

## Task 7: Update `renderList` — icon actions, location column, status badge colors

**Files:**
- Modify: `index.html` (JS, `renderList` ~lines 742–796)

- [ ] **Step 1: Replace `renderList` with updated version**

Replace the entire `renderList` function:
```js
function renderList() {
  const fuel = document.querySelector('#list-filters .fuel-toggle button.active')?.dataset.fuel || '';
  const source = document.getElementById('list-source-filter').value;
  const status = document.getElementById('list-status-filter').value;
  const make = document.getElementById('list-make-filter').value;
  let filtered = filterCars(cars, 'list-search', fuel, source, status, make);

  // Sort
  filtered.sort((a, b) => {
    let av, bv;
    if (listSort.field === 'score') { av = computeScore(a); bv = computeScore(b); }
    else if (listSort.field === 'addedAt') { av = a.addedAt; bv = b.addedAt; }
    else { av = a[listSort.field]; bv = b[listSort.field]; }
    if (av < bv) return listSort.asc ? -1 : 1;
    if (av > bv) return listSort.asc ? 1 : -1;
    return 0;
  });

  // Populate make dropdown
  const makes = [...new Set(cars.map(c => c.make).filter(Boolean))].sort();
  const makeSel = document.getElementById('list-make-filter');
  const curMake = makeSel.value;
  makeSel.innerHTML = '<option value="">All Makes</option>' + makes.map(m => `<option value="${esc(m)}"${m === curMake ? ' selected' : ''}>${esc(m)}</option>`).join('');

  const wrap = document.getElementById('list-table-wrap');
  if (!filtered.length) {
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state-icon">\u2015</div>No cars match filters</div>';
    return;
  }

  let html = `<table class="list-table"><thead><tr>
    <th>Title</th><th>Source</th><th>Local</th><th>Year</th><th>Km</th><th>Price</th>
    <th>Fuel</th><th>Status</th><th>Score</th><th></th>
  </tr></thead><tbody>`;

  filtered.forEach(car => {
    const score = computeScore(car);
    const sc = scoreClass(score);
    const compareActive = selectedForCompare.has(car.id) ? ' compare-active' : '';
    const statusClass = ['sem-resposta', 'inativo'].includes(car.status) ? ` ${car.status}` : '';
    const urlBtn = car.url ? `<a href="${esc(car.url)}" target="_blank" rel="noopener noreferrer"
        onclick="event.stopPropagation()" class="icon-btn" title="Open listing">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 3H3v10h10v-3M9 1h6v6M7 9L15 1"/>
        </svg></a>` : '';
    html += `<tr onclick="openDetail('${car.id}')">
      <td class="td-title">${esc(car.title)}</td>
      <td>${car.source ? `<span class="source-tag">${esc(car.source)}</span>` : '\u2014'}</td>
      <td class="td-mono">${esc(car.location || '') || '\u2014'}</td>
      <td class="td-mono">${car.year || '\u2014'}</td>
      <td class="td-mono">${car.km ? car.km.toLocaleString() : '\u2014'}</td>
      <td class="td-price">${car.price ? '\u20AC' + car.price.toLocaleString() : '\u2014'}</td>
      <td>${car.fuel || '\u2014'}</td>
      <td><span class="status-badge${statusClass}">${STATUS_LABELS[car.status] || car.status}</span></td>
      <td><span class="chip chip-score ${sc}">${score}</span></td>
      <td class="td-actions" onclick="event.stopPropagation()">
        ${urlBtn}
        <button class="icon-btn${compareActive}" onclick="toggleCompare('${car.id}')" title="Compare">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </button>
        <button class="icon-btn" onclick="openModal('${car.id}')" title="Edit">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M11 2l3 3-8 8H3v-3L11 2z"/>
          </svg>
        </button>
        <button class="icon-btn" onclick="deleteCar('${car.id}')" title="Delete">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 4h10M6 4V2h4v2M5 4v9h6V4"/>
          </svg>
        </button>
      </td>
    </tr>`;
  });

  html += '</tbody></table>';
  wrap.innerHTML = html;
}
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: update list view — icon actions, location column, status badge staleness colors"
```

---

## Task 8: Update `openDetail` — add location to detail grid

**Files:**
- Modify: `index.html` (JS, `openDetail` ~lines 856–895)

- [ ] **Step 1: Add location chip to detail grid**

Find this block inside `openDetail` (lines 869–874):
```js
    <div class="detail-grid">
      <div class="detail-chip"><label>Year</label><span>${car.year || '\u2014'}</span></div>
      <div class="detail-chip"><label>Km</label><span>${car.km ? car.km.toLocaleString() : '\u2014'}</span></div>
      <div class="detail-chip"><label>Fuel</label><span>${car.fuel || '\u2014'}</span></div>
      <div class="detail-chip"><label>Price</label><span style="color:var(--green)">${car.price ? '\u20AC' + car.price.toLocaleString() : '\u2014'}</span></div>
    </div>
```
Replace with:
```js
    <div class="detail-grid">
      <div class="detail-chip"><label>Year</label><span>${car.year || '\u2014'}</span></div>
      <div class="detail-chip"><label>Km</label><span>${car.km ? car.km.toLocaleString() : '\u2014'}</span></div>
      <div class="detail-chip"><label>Fuel</label><span>${car.fuel || '\u2014'}</span></div>
      <div class="detail-chip"><label>Price</label><span style="color:var(--green)">${car.price ? '\u20AC' + car.price.toLocaleString() : '\u2014'}</span></div>
      ${car.location ? `<div class="detail-chip" style="grid-column:1/-1"><label>Local</label><span style="font-size:0.95rem">📍 ${esc(car.location)}</span></div>` : ''}
    </div>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add location to detail panel"
```

---

## Task 9: Update `openModal` and `handleSubmit` — location field + model datalist

**Files:**
- Modify: `index.html` (JS, `openModal` ~lines 903–935, `handleSubmit` ~lines 954–979)

- [ ] **Step 1: Add location to `openModal` — populate when editing**

Find this line inside `openModal` (in the `if (id)` block, after `form-notes`):
```js
    document.getElementById('form-notes').value = car.notes || '';
```
After it, add:
```js
    document.getElementById('form-location').value = car.location || '';
    updateModelDatalist(car.make || '');
```

Also add this in the `else` block (when opening for new car, after `document.getElementById('form-id').value = '';`):
```js
    updateModelDatalist('');
```

- [ ] **Step 2: Add location to `handleSubmit` data object (lines 956–968)**

```js
// OLD
  const data = {
    url: document.getElementById('form-url').value,
    title: document.getElementById('form-title').value,
    make: document.getElementById('form-make').value,
    model: document.getElementById('form-model').value,
    year: document.getElementById('form-year').value,
    km: document.getElementById('form-km').value,
    price: document.getElementById('form-price').value,
    fuel: document.getElementById('form-fuel').value,
    source: document.getElementById('form-source').value,
    status: document.getElementById('form-status').value,
    notes: document.getElementById('form-notes').value
  };
```
With:
```js
  const data = {
    url: document.getElementById('form-url').value,
    title: document.getElementById('form-title').value,
    make: document.getElementById('form-make').value,
    model: document.getElementById('form-model').value,
    year: document.getElementById('form-year').value,
    km: document.getElementById('form-km').value,
    price: document.getElementById('form-price').value,
    fuel: document.getElementById('form-fuel').value,
    source: document.getElementById('form-source').value,
    status: document.getElementById('form-status').value,
    location: document.getElementById('form-location').value,
    notes: document.getElementById('form-notes').value
  };
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: wire location field in modal submit and populate model datalist on edit"
```

---

## Task 10: End-to-end verification

- [ ] **Step 1: Start the server**

```bash
cd "/Users/pedrorocha/Documents/Personal Projects/car-organizer"
node server.js
```

- [ ] **Step 2: Open http://localhost:3000 and verify**

Run through this checklist manually:

1. **Pipeline**: 7 columns visible (To Contact, Contacted, Sem Resposta, Inativo, Negociação, Rejeitado, Comprado). No visit-scheduled/visited columns.
2. **Drag-and-drop**: Drag a card to another column → card moves; column highlights on dragover.
3. **Add Car**: Click "+ Add Car" button — button looks consistent with the header style.
4. **URL inference**: In the Add modal, paste `https://www.standvirtual.com/anuncios/volkswagen-polo-abc123/` into the URL field and tab out → Source = "StandVirtual", Make = "Volkswagen", Model = "Polo" auto-filled.
5. **Location**: Add a car with Localização = "Lisboa" → visible in pipeline card (📍 Lisboa), list table Local column, and detail panel.
6. **List view**: Actions column shows icon buttons (🔗 only if URL exists, compare, edit, delete). Status "sem-resposta" has amber badge; "inativo" has dark red badge.
7. **Staleness**: Manually edit `data.json` to set a car's `status` to `"contacted"` and `contactedAt` to 4 days ago → reload page → status should auto-change to `"sem-resposta"`.
8. **Comboboxes**: Typing "Volks" in Make shows "Volkswagen" suggestion. Typing an unknown make still works.

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "chore: verified vehicle enhancements end-to-end"
```
