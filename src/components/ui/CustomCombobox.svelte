<script lang="ts">
	let {
		value = $bindable(''),
		options,
		placeholder,
		id,
		name,
		oninput
	}: {
		value?: string;
		options: string[];
		placeholder?: string;
		id?: string;
		name?: string;
		oninput?: (v: string) => void;
	} = $props();

	let open = $state(false);
	let kbdIdx = $state(-1);
	let wrap: HTMLDivElement | undefined;
	let input: HTMLInputElement | undefined;

	const matches = $derived.by(() => {
		const q = (value ?? '').trim().toLowerCase();
		if (!options.length) return [];
		if (!q) return options;
		return options.filter((v) => v.toLowerCase().includes(q));
	});

	function openNow() {
		if (matches.length) open = true;
	}
	function closeNow() {
		open = false;
		kbdIdx = -1;
	}

	function pick(v: string) {
		value = v;
		oninput?.(v);
		closeNow();
		input?.focus();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (!open) openNow();
			kbdIdx = Math.min(kbdIdx + 1, matches.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			kbdIdx = Math.max(kbdIdx - 1, 0);
		} else if (e.key === 'Enter') {
			if (open && kbdIdx >= 0 && matches[kbdIdx]) {
				e.preventDefault();
				pick(matches[kbdIdx]);
			}
		} else if (e.key === 'Escape') {
			closeNow();
		}
	}

	function onDocClick(e: MouseEvent) {
		if (wrap && !wrap.contains(e.target as Node)) closeNow();
	}

	$effect(() => {
		if (!open) return;
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	});
</script>

<div class="custom-combobox-wrap" class:open bind:this={wrap}>
	<input
		bind:this={input}
		{id}
		{name}
		type="text"
		bind:value
		{placeholder}
		autocomplete="off"
		oninput={(e) => {
			value = (e.currentTarget as HTMLInputElement).value;
			oninput?.(value);
			openNow();
		}}
		onfocus={openNow}
		onkeydown={onKeydown}
	/>
	{#if open && matches.length}
		<div class="custom-select-dropdown custom-combobox-dropdown" role="listbox">
			{#each matches as m, i (m)}
				<div
					class="custom-select-option"
					class:kbd-active={i === kbdIdx}
					role="option"
					aria-selected={i === kbdIdx}
					tabindex="-1"
					onmousedown={(e) => {
						e.preventDefault();
						pick(m);
					}}
				>
					{m}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.custom-combobox-wrap {
		position: relative;
	}
	input {
		width: 100%;
		padding: 0.55rem 0.85rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		font-size: var(--fs-sm);
		background: var(--bg-card);
		color: var(--text);
	}
	input:focus {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.custom-combobox-wrap.open input {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		border-color: var(--accent);
	}
	.custom-select-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--bg-card);
		border: 1px solid var(--accent);
		border-top: 0;
		border-bottom-left-radius: var(--radius-md);
		border-bottom-right-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		z-index: 50;
		max-height: 240px;
		overflow-y: auto;
	}
	.custom-select-option {
		padding: 0.5rem 0.85rem;
		font-size: var(--fs-sm);
		cursor: pointer;
	}
	.custom-select-option:hover,
	.custom-select-option.kbd-active {
		background: var(--bg-warm);
	}
</style>
