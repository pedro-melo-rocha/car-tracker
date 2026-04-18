<script lang="ts">
	import type { Car, CarCreateInput } from '$lib/types';
	import { STATUSES, STATUS_LABELS } from '$lib/types';
	import { DATALIST_MAKES, DATALIST_ENGINES, EXTRA_MAKES } from '$lib/constants';
	import { createCar, updateCar } from '$lib/stores/cars';
	import { cars as carsStore } from '$lib/stores/cars';
	import { toast } from '$lib/stores/ui';
	import { inferFromUrl } from '$lib/inference';
	import { get } from 'svelte/store';
	import CustomSelect from '$components/ui/CustomSelect.svelte';
	import CustomCombobox from '$components/ui/CustomCombobox.svelte';

	let {
		car,
		onclose
	}: {
		car?: Car;
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
		priceNote: string;
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
			priceNote: ''
		};
	}

	// svelte-ignore state_referenced_locally
	let f = $state<FormState>(toForm(car));
	// svelte-ignore state_referenced_locally
	let originalPrice = $state<number | undefined>(car?.price ?? undefined);
	let submitting = $state(false);

	const priceChanged = $derived(
		isEdit && f.price != null && f.price !== '' && Number(f.price) !== originalPrice
	);

	const fuelOptions = [
		{ value: '', label: '—' },
		{ value: 'Diesel', label: 'Diesel' },
		{ value: 'Gasolina', label: 'Gasolina' }
	];
	const sourceOptions = [
		{ value: '', label: '—' },
		{ value: 'StandVirtual', label: 'StandVirtual' },
		{ value: 'AutoScout24', label: 'AutoScout24' },
		{ value: 'OLX', label: 'OLX' },
		{ value: 'Facebook Marketplace', label: 'Facebook Marketplace' },
		{ value: 'PiscaPisca', label: 'PiscaPisca' },
		{ value: 'CustoJusto', label: 'CustoJusto' },
		{ value: 'Other', label: 'Other' }
	];
	const statusOptions = STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }));
	const allMakes = [...DATALIST_MAKES, ...EXTRA_MAKES].sort();

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

	async function onSubmit(e: Event) {
		e.preventDefault();
		if (submitting) return;

		const title = f.title.trim();
		if (!title) {
			toast.error('Title is required');
			return;
		}

		const payload: CarCreateInput = {
			url: f.url.trim() || undefined,
			title,
			make: f.make.trim() || undefined,
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
			notes: f.notes || undefined
		};

		submitting = true;
		try {
			if (car) {
				const patch: Partial<CarCreateInput> & { priceNote?: string } = { ...payload };
				if (priceChanged && f.priceNote.trim()) patch.priceNote = f.priceNote.trim();
				await updateCar(car.id, patch);
			} else {
				if (payload.url) {
					const dup = get(carsStore).find(
						(c) => c.url && c.url.trim() === payload.url!.trim()
					);
					if (dup) {
						toast.error(`URL already added: "${dup.title}"`);
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
	<div class="form-group">
		<label for="f-url">URL</label>
		<input
			id="f-url"
			type="url"
			placeholder="Listing URL"
			bind:value={f.url}
			onblur={handleUrlBlur}
		/>
	</div>

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
			<label for="f-year">Year</label>
			<input
				id="f-year"
				type="number"
				placeholder="2008"
				min="1950"
				max="2100"
				step="1"
				bind:value={f.year}
			/>
		</div>
		<div class="form-group">
			<label for="f-km">Km</label>
			<input id="f-km" type="number" placeholder="120000" min="0" step="1" bind:value={f.km} />
		</div>
	</div>

	<div class="form-row">
		<div class="form-group">
			<label for="f-price">Price (EUR)</label>
			<input id="f-price" type="number" placeholder="5500" min="0" step="1" bind:value={f.price} />
		</div>
		<div class="form-group">
			<label for="f-fuel">Fuel</label>
			<CustomSelect options={fuelOptions} placeholder="—" bind:value={f.fuel} />
		</div>
	</div>

	<div class="form-row">
		<div class="form-group">
			<label for="f-engine">Engine</label>
			<CustomCombobox
				id="f-engine"
				options={DATALIST_ENGINES}
				placeholder="e.g. 1.5 dCi, 1.4 D-4D"
				bind:value={f.engine}
			/>
		</div>
		<div class="form-group">
			<label for="f-power">Power (cv)</label>
			<input id="f-power" type="number" placeholder="90" min="0" step="1" bind:value={f.power} />
		</div>
	</div>

	<div class="form-row">
		<div class="form-group">
			<label for="f-source">Source</label>
			<CustomSelect options={sourceOptions} placeholder="—" bind:value={f.source} />
		</div>
		<div class="form-group">
			<label for="f-status">Status</label>
			<CustomSelect options={statusOptions} bind:value={f.status} />
		</div>
	</div>

	<div class="form-group">
		<label for="f-location">Localização</label>
		<input id="f-location" type="text" placeholder="e.g. Lisboa, Porto" bind:value={f.location} />
	</div>

	<div class="form-group">
		<label for="f-notes">Notes</label>
		<textarea id="f-notes" placeholder="Free text notes..." bind:value={f.notes}></textarea>
	</div>

	{#if priceChanged}
		<div class="form-group price-change">
			<label for="f-pn">Reason for price change</label>
			<textarea
				id="f-pn"
				rows="2"
				placeholder="e.g. Seller lowered asking price"
				bind:value={f.priceNote}
			></textarea>
		</div>
	{/if}

	<div class="form-actions">
		<button type="button" class="btn secondary" onclick={onclose}>Cancel</button>
		<button type="submit" class="btn primary" disabled={submitting}>
			{isEdit ? 'Save Changes' : 'Add Car'}
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
		font-size: 0.7rem;
		color: var(--ink-dim);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
	}
	input,
	textarea {
		padding: 10px 14px;
		border: 1px solid var(--rule);
		border-radius: 10px;
		font-size: 0.85rem;
		background: var(--card-2);
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
	.price-change {
		background: var(--warn-bg);
		padding: 10px 12px;
		border-radius: 10px;
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
	}
	.btn.primary:hover {
		background: var(--accent-hover);
	}
	.btn.primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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
