<script lang="ts">
	import type { Car, CarCreateInput } from '$lib/types';
	import { STATUSES, STATUS_LABELS } from '$lib/types';
	import {
		DATALIST_MAKES,
		DATALIST_ENGINES,
		EXTRA_MAKES,
		getModelEngineHints,
		normalizeMake
	} from '$lib/constants';
	import { createCar, updateCar } from '$lib/stores/cars';
	import { cars as carsStore } from '$lib/stores/cars';
	import { toast } from '$lib/stores/ui';
	import { inferFromUrl } from '$lib/inference';
	import { apiFetch } from '$lib/api';
	import { get } from 'svelte/store';
	import { normalizeListingUrl } from '$lib/listing';
	import CustomSelect from '$components/ui/CustomSelect.svelte';
	import CustomCombobox from '$components/ui/CustomCombobox.svelte';
	import ScoreBadge from '$components/ui/ScoreBadge.svelte';
	import { computeScore } from '$lib/scoring';

	let {
		car,
		initialImportUrl,
		onclose
	}: {
		car?: Car;
		initialImportUrl?: string;
		onclose: () => void;
	} = $props();

	const isEdit = $derived(!!car);

	type NumField = string | number | null;
	type FormState = {
		url: string;
		title: string;
		make: string;
		model: string;
		year: NumField;
		km: NumField;
		price: NumField;
		fuel: string;
		engine: string;
		power: NumField;
		source: string;
		status: string;
		location: string;
		notes: string;
		imageUrl: string;
		priceNote: string;
		sellerType: string;
		sellerSince: NumField;
		gearbox: string;
		owners: NumField;
		warrantyMonths: NumField;
		imported: string;
		// Carried from import, not editable in the form.
		listedAt: string;
		photoCount: NumField;
		description: string;
	};

	function toForm(c?: Car): FormState {
		return {
			url: c?.url ?? '',
			title: c?.title ?? '',
			make: c?.make ?? '',
			model: c?.model ?? '',
			year: c?.year?.toString() ?? '',
			km: c?.km?.toString() ?? '',
			price: c?.price?.toString() ?? '',
			fuel: c?.fuel ?? '',
			engine: c?.engine ?? '',
			power: c?.power?.toString() ?? '',
			source: c?.source ?? '',
			status: c?.status ?? 'to-contact',
			location: c?.location ?? '',
			notes: c?.notes ?? '',
			imageUrl: c?.imageUrl ?? '',
			priceNote: '',
			sellerType: c?.sellerType ?? '',
			sellerSince: c?.sellerSince?.toString() ?? '',
			gearbox: c?.gearbox ?? '',
			owners: c?.owners?.toString() ?? '',
			warrantyMonths: c?.warrantyMonths?.toString() ?? '',
			imported: c?.imported == null ? '' : c.imported ? 'yes' : 'no',
			listedAt: c?.listedAt ?? '',
			photoCount: c?.photoCount?.toString() ?? '',
			description: c?.description ?? ''
		};
	}

	// svelte-ignore state_referenced_locally
	let f = $state<FormState>(toForm(car));
	// svelte-ignore state_referenced_locally
	let originalPrice = $state<number | undefined>(car?.price ?? undefined);
	let submitting = $state(false);
	// svelte-ignore state_referenced_locally
	let importUrl = $state(initialImportUrl ?? '');
	let importing = $state(false);
	let autoImported = false;

	$effect(() => {
		if (autoImported) return;
		if (initialImportUrl && !car) {
			autoImported = true;
			void onImport();
		}
	});

	const FIELD_LABELS: Record<string, string> = {
		title: 'title',
		price: 'price',
		km: 'km',
		year: 'year',
		fuel: 'fuel',
		make: 'make',
		model: 'model'
	};

	function findDuplicate(url: string | undefined): Car | undefined {
		const u = normalizeListingUrl(url);
		if (!u) return undefined;
		return get(carsStore).find((c) => c.url && normalizeListingUrl(c.url) === u);
	}

	async function onImport() {
		const u = importUrl.trim();
		if (!u || importing) return;
		const existing = findDuplicate(u);
		if (existing) {
			toast.error(`Already in your list: "${existing.title}"`);
			return;
		}
		importing = true;
		try {
			const r = await apiFetch<{
				data: Partial<CarCreateInput>;
				source: string | null;
				warnings: string[];
			}>('/api/import', { method: 'POST', body: JSON.stringify({ url: u }) });
			const d = r.data;
			const dupAfter = findDuplicate(d.url);
			if (dupAfter) {
				toast.error(`Already in your list: "${dupAfter.title}"`);
				return;
			}
			f.url = d.url ?? '';
			f.title = d.title ?? '';
			f.make = d.make ?? '';
			f.model = d.model ?? '';
			f.year = d.year != null ? String(d.year) : '';
			f.km = d.km != null ? String(d.km) : '';
			f.price = d.price != null ? String(d.price) : '';
			f.fuel = d.fuel ?? '';
			f.engine = d.engine ?? '';
			f.power = d.power != null ? String(d.power) : '';
			f.source = d.source ?? '';
			f.location = d.location ?? '';
			f.imageUrl = d.imageUrl ?? '';
			f.sellerType = d.sellerType ?? '';
			f.sellerSince = d.sellerSince != null ? String(d.sellerSince) : '';
			f.gearbox = d.gearbox ?? '';
			f.owners = d.owners != null ? String(d.owners) : '';
			f.warrantyMonths = d.warrantyMonths != null ? String(d.warrantyMonths) : '';
			f.imported = d.imported == null ? '' : d.imported ? 'yes' : 'no';
			f.listedAt = d.listedAt ?? '';
			f.photoCount = d.photoCount != null ? String(d.photoCount) : '';
			f.description = d.description ?? '';
			if (r.warnings.length) {
				const missing = r.warnings.map((w) => FIELD_LABELS[w] || w).join(', ');
				toast.info(`Imported. Still missing: ${missing}`);
			} else {
				toast.success('Imported from the listing');
			}
		} catch {
			/* apiFetch already toasted */
			if (!f.url) f.url = u;
		} finally {
			importing = false;
		}
	}

	const priceChanged = $derived(
		isEdit && f.price != null && f.price !== '' && Number(f.price) !== originalPrice
	);

	const fuelOptions = [
		{ value: '', label: 'Not set' },
		{ value: 'Diesel', label: 'Diesel' },
		{ value: 'Gasolina', label: 'Gasolina' }
	];
	const sourceOptions = [
		{ value: '', label: 'Not set' },
		{ value: 'StandVirtual', label: 'StandVirtual' },
		{ value: 'AutoScout24', label: 'AutoScout24' },
		{ value: 'OLX', label: 'OLX' },
		{ value: 'Facebook Marketplace', label: 'Facebook Marketplace' },
		{ value: 'PiscaPisca', label: 'PiscaPisca' },
		{ value: 'CustoJusto', label: 'CustoJusto' },
		{ value: 'Other', label: 'Other' }
	];
	const gearboxOptions = [
		{ value: '', label: 'Not set' },
		{ value: 'Manual', label: 'Manual' },
		{ value: 'Automática', label: 'Automática' }
	];
	const sellerOptions = [
		{ value: '', label: 'Not set' },
		{ value: 'private', label: 'Private' },
		{ value: 'dealer', label: 'Dealer' }
	];
	const importedOptions = [
		{ value: '', label: 'Not set' },
		{ value: 'no', label: 'No' },
		{ value: 'yes', label: 'Yes' }
	];
	const statusOptions = STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }));
	const allMakes = [...DATALIST_MAKES, ...EXTRA_MAKES].sort();

	// Engine options ranked by make+model match: hinted engines first (in curated order), then everything else.
	const rankedEngineOptions = $derived.by(() => {
		const hints = getModelEngineHints(f.make, f.model);
		if (hints.length === 0) return DATALIST_ENGINES;
		const hintSet = new Set(hints);
		const rest = DATALIST_ENGINES.filter((e) => !hintSet.has(e));
		return [...hints, ...rest];
	});

	function handleUrlBlur() {
		if (!f.url.trim() || isEdit) return;
		const inferred = inferFromUrl(f.url);
		if (!inferred) return;
		if (!f.make && inferred.make) f.make = inferred.make;
		if (!f.model && inferred.model) f.model = inferred.model;
		if (!f.year && inferred.year) f.year = String(inferred.year);
		if (!f.km && inferred.km) f.km = String(inferred.km);
		if (!f.price && inferred.price) f.price = String(inferred.price);
		if (!f.fuel && inferred.fuel) f.fuel = inferred.fuel;
		if (!f.engine && inferred.engine) f.engine = inferred.engine;
		if (!f.power && inferred.power) f.power = String(inferred.power);
		if (!f.source && inferred.source) f.source = inferred.source;
		if (!f.location && inferred.location) f.location = inferred.location;
	}

	function toNumber(v: string | number | null | undefined): number | undefined {
		if (v === null || v === undefined) return undefined;
		if (typeof v === 'number') return isNaN(v) ? undefined : v;
		if (v.trim() === '') return undefined;
		const n = Number(v);
		return isNaN(n) ? undefined : n;
	}

	// Live score while typing; needs at least one scoring input to be meaningful.
	const liveScore = $derived.by(() => {
		const km = toNumber(f.km);
		const price = toNumber(f.price);
		const year = toNumber(f.year);
		if (km == null && price == null && year == null && !f.make && !f.location) return null;
		return computeScore({
			km: km ?? null,
			price: price ?? null,
			year: year ?? null,
			fuel: f.fuel || null,
			location: f.location || null,
			make: f.make || null,
			engine: f.engine || null,
			title: f.title,
			notes: f.notes || null
		});
	});

	async function onSubmit(e: Event) {
		e.preventDefault();
		if (submitting) return;

		const title = f.title.trim();
		if (!title) {
			toast.error('Add a title before saving');
			return;
		}

		const payload: CarCreateInput = {
			url: f.url.trim() || undefined,
			title,
			make: normalizeMake(f.make) || undefined,
			model: f.model.trim() || undefined,
			year: toNumber(f.year),
			km: toNumber(f.km),
			price: toNumber(f.price),
			fuel: f.fuel || undefined,
			engine: f.engine.trim() || undefined,
			power: toNumber(f.power),
			source: f.source || undefined,
			status: (f.status as Car['status']) || 'to-contact',
			location: f.location.trim() || undefined,
			notes: f.notes || undefined,
			imageUrl: f.imageUrl.trim() || undefined,
			sellerType: (f.sellerType as CarCreateInput['sellerType']) || undefined,
			sellerSince: toNumber(f.sellerSince),
			gearbox: f.gearbox || undefined,
			owners: toNumber(f.owners),
			warrantyMonths: toNumber(f.warrantyMonths),
			imported: f.imported === '' ? undefined : f.imported === 'yes',
			listedAt: f.listedAt || undefined,
			photoCount: toNumber(f.photoCount),
			description: f.description || undefined
		};

		submitting = true;
		try {
			if (car) {
				const patch: Partial<CarCreateInput> & { priceNote?: string } = { ...payload };
				if (priceChanged && f.priceNote.trim()) patch.priceNote = f.priceNote.trim();
				await updateCar(car.id, patch);
				toast.success('Car updated');
			} else {
				if (payload.url) {
					const dup = findDuplicate(payload.url);
					if (dup) {
						toast.error(`Already in your list: "${dup.title}"`);
						submitting = false;
						return;
					}
				}
				await createCar(payload);
			}
			onclose();
		} catch {
			/* apiFetch already toasted */
		} finally {
			submitting = false;
		}
	}
</script>

<form onsubmit={onSubmit}>
	{#if !isEdit}
		<div class="form-group import-row">
			<label for="f-import">Import from the listing link</label>
			<div class="import-input-row">
				<input
					id="f-import"
					type="url"
					placeholder="StandVirtual, OLX, PiscaPisca or CustoJusto link"
					bind:value={importUrl}
					disabled={importing}
				/>
				<button
					type="button"
					class="btn secondary import-btn"
					onclick={onImport}
					disabled={importing || !importUrl.trim()}
				>
					{#if importing}
						<span class="btn-spinner dark" aria-hidden="true"></span>
						<span>Importing…</span>
					{:else}
						<span>Import</span>
					{/if}
				</button>
			</div>
			<p class="field-hint">Fills in what it can. You can fix anything below.</p>
		</div>
	{/if}

	{#if f.imageUrl.trim()}
		<img
			class="image-preview"
			src={f.imageUrl.trim()}
			alt=""
			loading="lazy"
			onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
			onload={(e) => ((e.currentTarget as HTMLImageElement).style.display = '')}
		/>
	{/if}

	<fieldset>
		<legend>The car</legend>
		<div class="form-group">
			<label for="f-title">Title</label>
			<input
				id="f-title"
				type="text"
				placeholder="e.g. Renault Clio III 1.5 dCi 2008"
				required
				bind:value={f.title}
			/>
		</div>

		<div class="form-row">
			<div class="form-group">
				<label for="f-make">Make</label>
				<CustomCombobox id="f-make" options={allMakes} placeholder="e.g. Renault" bind:value={f.make} />
			</div>
			<div class="form-group">
				<label for="f-model">Model</label>
				<input id="f-model" type="text" placeholder="e.g. Clio" bind:value={f.model} autocomplete="off" />
			</div>
		</div>

		<div class="form-row">
			<div class="form-group">
				<label for="f-price">Price (€)</label>
				<input id="f-price" type="number" inputmode="numeric" min="0" step="1" bind:value={f.price} />
			</div>
			<div class="form-group">
				<label for="f-km">Km</label>
				<input id="f-km" type="number" inputmode="numeric" min="0" step="1" bind:value={f.km} />
			</div>
		</div>

		<div class="form-row">
			<div class="form-group">
				<label for="f-year">Year</label>
				<input id="f-year" type="number" inputmode="numeric" min="1950" max="2100" step="1" bind:value={f.year} />
			</div>
			<div class="form-group">
				<label for="f-fuel">Fuel</label>
				<CustomSelect id="f-fuel" options={fuelOptions} placeholder="Not set" bind:value={f.fuel} />
			</div>
		</div>

		<div class="form-row">
			<div class="form-group">
				<label for="f-engine">Engine</label>
				<CustomCombobox
					id="f-engine"
					options={rankedEngineOptions}
					placeholder="e.g. 1.5 dCi"
					bind:value={f.engine}
				/>
			</div>
			<div class="form-group">
				<label for="f-power">Power (cv)</label>
				<input id="f-power" type="number" inputmode="numeric" min="0" step="1" bind:value={f.power} />
			</div>
		</div>

		<div class="form-row">
			<div class="form-group">
				<label for="f-location">Location</label>
				<input id="f-location" type="text" placeholder="e.g. Braga" bind:value={f.location} />
			</div>
			<div class="form-group">
				<label for="f-gearbox">Gearbox</label>
				<CustomSelect id="f-gearbox" options={gearboxOptions} placeholder="Not set" bind:value={f.gearbox} />
			</div>
		</div>

		<div class="live-score" aria-live="polite">
			{#if liveScore != null}
				<ScoreBadge score={liveScore} size="sm" />
				<span>Score with what’s filled in so far</span>
			{:else}
				<span class="muted">Fill in price, km or year to see the score.</span>
			{/if}
		</div>
	</fieldset>

	<fieldset>
		<legend>Tracking</legend>
		<div class="form-row">
			<div class="form-group">
				<label for="f-status">Status</label>
				<CustomSelect id="f-status" options={statusOptions} bind:value={f.status} />
			</div>
			<div class="form-group">
				<label for="f-source">Source</label>
				<CustomSelect id="f-source" options={sourceOptions} placeholder="Not set" bind:value={f.source} />
			</div>
		</div>

		{#if isEdit}
			<div class="form-group">
				<label for="f-url">Listing link</label>
				<input id="f-url" type="url" bind:value={f.url} onblur={handleUrlBlur} />
			</div>
			<div class="form-group">
				<label for="f-image-url">Photo link</label>
				<input id="f-image-url" type="url" bind:value={f.imageUrl} />
			</div>
		{/if}

		<div class="form-group">
			<label for="f-notes">Notes</label>
			<textarea id="f-notes" placeholder="What the seller said, when to call back…" bind:value={f.notes}></textarea>
		</div>

		{#if priceChanged}
			<div class="form-group price-change">
				<label for="f-pn">Why did the price change?</label>
				<textarea
					id="f-pn"
					rows="2"
					placeholder="e.g. Seller dropped it after we called"
					bind:value={f.priceNote}
				></textarea>
			</div>
		{/if}
	</fieldset>

	<details class="signals">
		<summary>Seller and listing details <span class="muted">(used by the scam check)</span></summary>
		<div class="signals-body">
			<div class="form-row">
				<div class="form-group">
					<label for="f-seller">Seller</label>
					<CustomSelect id="f-seller" options={sellerOptions} placeholder="Not set" bind:value={f.sellerType} />
				</div>
				<div class="form-group">
					<label for="f-seller-since">Seller account since (year)</label>
					<input id="f-seller-since" type="number" inputmode="numeric" min="1990" max="2100" step="1" bind:value={f.sellerSince} />
				</div>
			</div>
			<div class="form-row">
				<div class="form-group">
					<label for="f-owners">Owners</label>
					<input id="f-owners" type="number" inputmode="numeric" min="0" step="1" bind:value={f.owners} />
				</div>
				<div class="form-group">
					<label for="f-warranty">Warranty (months)</label>
					<input id="f-warranty" type="number" inputmode="numeric" min="0" step="1" bind:value={f.warrantyMonths} />
				</div>
			</div>
			<div class="form-row">
				<div class="form-group">
					<label for="f-imported">Imported</label>
					<CustomSelect id="f-imported" options={importedOptions} placeholder="Not set" bind:value={f.imported} />
				</div>
			</div>
		</div>
	</details>

	<div class="form-actions">
		<button type="button" class="btn secondary" onclick={onclose} disabled={submitting}>Cancel</button>
		<button type="submit" class="btn primary" disabled={submitting}>
			{#if submitting}
				<span class="btn-spinner" aria-hidden="true"></span>
				<span>{isEdit ? 'Saving…' : 'Adding…'}</span>
			{:else}
				<span>{isEdit ? 'Save changes' : 'Add car'}</span>
			{/if}
		</button>
	</div>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	label {
		font-size: 0.82rem;
		color: var(--ink-soft);
		font-weight: 500;
	}
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}
	legend {
		font-size: 0.95rem;
		font-weight: 650;
		letter-spacing: -0.01em;
		color: var(--ink);
		margin-bottom: 0.6rem;
		padding: 0;
	}
	fieldset + fieldset,
	.signals {
		border-top: 1px solid var(--rule);
		padding-top: 1rem;
	}
	.field-hint,
	.muted {
		font-size: 0.8rem;
		color: var(--ink-soft);
		font-weight: 400;
	}
	.live-score {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 36px;
		font-size: 0.85rem;
		color: var(--ink);
	}
	.signals summary {
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 650;
		color: var(--ink);
	}
	.signals-body {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		margin-top: 0.85rem;
	}
	input,
	textarea {
		padding: 10px 14px;
		border: 1px solid var(--rule);
		border-radius: 10px;
		font-size: 0.85rem;
		background: var(--card);
		color: var(--ink);
		font-family: inherit;
		transition: border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease);
	}
	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--accent);
		background: var(--card);
	}
	textarea {
		min-height: 80px;
		resize: vertical;
	}
	.image-preview {
		margin-top: 6px;
		max-height: 140px;
		width: 100%;
		object-fit: cover;
		border-radius: 8px;
		background: var(--card-2);
	}
	.price-change {
		background: var(--warn-bg);
		padding: 10px 12px;
		border-radius: 10px;
	}
	.import-input-row {
		display: flex;
		gap: 8px;
	}
	.import-input-row input {
		flex: 1;
	}
	.import-btn {
		flex-shrink: 0;
		min-width: 112px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}
	.form-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		margin-top: 8px;
	}
	.btn {
		padding: 10px 18px;
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-width: 128px;
	}
	.btn.primary:hover {
		background: var(--accent-hover);
	}
	.btn.primary:disabled {
		opacity: 0.85;
		cursor: not-allowed;
	}
	.btn.secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn-spinner.dark {
		border-color: var(--rule);
		border-top-color: var(--ink-soft);
	}
	.btn-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255, 255, 255, 0.35);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 800ms linear infinite;
		display: inline-block;
		flex-shrink: 0;
	}
	.btn.secondary {
		background: transparent;
		color: var(--ink-soft);
		border: 1px solid var(--rule);
	}
	.btn.secondary:hover {
		background: var(--card-2);
		color: var(--ink);
	}
	@media (max-width: 640px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
