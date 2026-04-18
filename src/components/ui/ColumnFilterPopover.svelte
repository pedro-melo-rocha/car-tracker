<script lang="ts">
	import { listFilters, type ListFilters } from '$lib/stores/filters';

	type CategoricalKey = 'sources' | 'makes' | 'statuses' | 'fuels';
	type RangeMinKey = 'yearMin' | 'kmMin' | 'priceMin' | 'scoreMin';
	type RangeMaxKey = 'yearMax' | 'kmMax' | 'priceMax' | 'scoreMax';

	type Meta =
		| { type: 'categorical'; key: CategoricalKey; title: string; options: string[] }
		| {
				type: 'range';
				minKey: RangeMinKey;
				maxKey: RangeMaxKey;
				title: string;
				placeholder: [string, string];
		  };

	let {
		meta,
		open = $bindable(false),
		onclose
	}: {
		meta: Meta;
		open?: boolean;
		onclose?: () => void;
	} = $props();

	let popover = $state<HTMLDivElement | undefined>(undefined);

	function toggleCategorical(val: string) {
		if (meta.type !== 'categorical') return;
		listFilters.update((f) => {
			const arr = [...(f[meta.key] as string[])];
			const idx = arr.indexOf(val);
			if (idx >= 0) arr.splice(idx, 1);
			else arr.push(val);
			return { ...f, [meta.key]: arr };
		});
	}

	function setRange(key: RangeMinKey | RangeMaxKey, raw: string) {
		const v = raw.trim() === '' ? null : Number(raw);
		listFilters.update((f) => ({ ...f, [key]: v }) as ListFilters);
	}

	function clear() {
		listFilters.update((f) => {
			if (meta.type === 'categorical') return { ...f, [meta.key]: [] };
			return { ...f, [meta.minKey]: null, [meta.maxKey]: null } as ListFilters;
		});
	}

	function close() {
		open = false;
		onclose?.();
	}

	function onDocClick(e: MouseEvent) {
		if (popover && !popover.contains(e.target as Node)) close();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	$effect(() => {
		if (!open) return;
		document.addEventListener('click', onDocClick, { capture: true });
		document.addEventListener('keydown', onKeydown);
		return () => {
			document.removeEventListener('click', onDocClick, { capture: true });
			document.removeEventListener('keydown', onKeydown);
		};
	});
</script>

{#if open}
	<div class="popover" bind:this={popover} role="dialog" aria-label={meta.title}>
		<div class="head">
			<span class="title">{meta.title}</span>
			<button type="button" class="clear" onclick={clear}>Clear</button>
		</div>
		{#if meta.type === 'categorical'}
			<div class="options">
				{#each meta.options as opt (opt)}
					<label class="option">
						<input
							type="checkbox"
							checked={($listFilters[meta.key] as string[]).includes(opt)}
							onchange={() => toggleCategorical(opt)}
						/>
						<span>{opt}</span>
					</label>
				{/each}
				{#if !meta.options.length}
					<div class="empty">No values available.</div>
				{/if}
			</div>
		{:else}
			<div class="range">
				<input
					type="number"
					placeholder={meta.placeholder[0]}
					value={$listFilters[meta.minKey] ?? ''}
					oninput={(e) => setRange(meta.minKey, (e.currentTarget as HTMLInputElement).value)}
				/>
				<input
					type="number"
					placeholder={meta.placeholder[1]}
					value={$listFilters[meta.maxKey] ?? ''}
					oninput={(e) => setRange(meta.maxKey, (e.currentTarget as HTMLInputElement).value)}
				/>
			</div>
		{/if}
		<div class="actions">
			<button type="button" class="btn" onclick={close}>Done</button>
		</div>
	</div>
{/if}

<style>
	.popover {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		z-index: 40;
		background: var(--bg-card);
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-xl);
		padding: 0.6rem 0.75rem;
		min-width: 220px;
		max-width: 280px;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 0.5rem;
	}
	.title {
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--text);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.clear {
		background: transparent;
		border: 0;
		font-size: 0.72rem;
		color: var(--accent);
		cursor: pointer;
	}
	.options {
		max-height: 220px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.option {
		display: flex;
		gap: 8px;
		align-items: center;
		padding: 4px 6px;
		border-radius: 4px;
		font-size: var(--fs-sm);
		cursor: pointer;
	}
	.option:hover {
		background: var(--bg-warm);
	}
	.empty {
		font-size: var(--fs-sm);
		color: var(--text-muted);
		padding: 4px;
	}
	.range {
		display: flex;
		gap: 0.4rem;
	}
	.range input {
		width: 100%;
		padding: 0.45rem 0.6rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		font-size: var(--fs-sm);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 0.5rem;
	}
	.btn {
		padding: 0.35rem 0.85rem;
		border: 0;
		border-radius: var(--radius-sm);
		background: var(--accent);
		color: #fff;
		font-size: var(--fs-sm);
		font-weight: 600;
		cursor: pointer;
	}
</style>
