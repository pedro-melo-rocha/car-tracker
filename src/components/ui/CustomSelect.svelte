<script lang="ts">
	import { tick } from 'svelte';

	interface Option {
		value: string;
		label: string;
	}

	let {
		value = $bindable(''),
		options,
		placeholder = 'Select…',
		ariaLabel,
		onchange
	}: {
		value?: string;
		options: Option[];
		placeholder?: string;
		ariaLabel?: string;
		onchange?: (v: string) => void;
	} = $props();

	let open = $state(false);
	let wrap: HTMLDivElement | undefined;
	let trigger: HTMLButtonElement | undefined;

	const selected = $derived(options.find((o) => o.value === value));
	const triggerLabel = $derived(selected?.label ?? placeholder);
	const isPlaceholder = $derived(!selected || selected.value === '');

	function toggle() {
		open = !open;
	}

	async function pick(v: string) {
		value = v;
		open = false;
		onchange?.(v);
		await tick();
		trigger?.focus();
	}

	function onKeydown(e: KeyboardEvent) {
		const idx = options.findIndex((o) => o.value === value);
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			open = !open;
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			const next = options[Math.min(idx + 1, options.length - 1)];
			if (next) {
				value = next.value;
				onchange?.(next.value);
			}
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			const prev = options[Math.max(idx - 1, 0)];
			if (prev) {
				value = prev.value;
				onchange?.(prev.value);
			}
		} else if (e.key === 'Escape') {
			open = false;
		}
	}

	function onDocClick(e: MouseEvent) {
		if (wrap && !wrap.contains(e.target as Node)) open = false;
	}

	$effect(() => {
		if (!open) return;
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	});
</script>

<div class="custom-select-wrap" class:open bind:this={wrap}>
	<button
		bind:this={trigger}
		type="button"
		class="custom-select-trigger"
		class:open
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label={ariaLabel}
		onclick={toggle}
		onkeydown={onKeydown}
	>
		<span class="custom-select-trigger-text" class:is-placeholder={isPlaceholder}
			>{triggerLabel}</span
		>
		<span class="custom-select-arrow" aria-hidden="true">
			<svg width="11" height="11" viewBox="0 0 12 12" fill="none">
				<path
					d="M2 4l4 4 4-4"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</span>
	</button>
	{#if open}
		<div class="custom-select-dropdown" role="listbox">
			{#each options as opt (opt.value)}
				<div
					class="custom-select-option"
					class:is-placeholder={opt.value === ''}
					class:selected={opt.value === value}
					role="option"
					aria-selected={opt.value === value}
					tabindex="-1"
					onmousedown={(e) => {
						e.preventDefault();
						pick(opt.value);
					}}
				>
					{opt.label}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.custom-select-wrap {
		position: relative;
	}
	.custom-select-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0.55rem 0.85rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		background: var(--bg-card);
		font-size: var(--fs-sm);
		color: var(--text);
		text-align: left;
		cursor: pointer;
	}
	.custom-select-trigger:focus {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.custom-select-trigger.open {
		border-color: var(--accent);
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}
	.custom-select-trigger-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}
	.custom-select-trigger-text.is-placeholder {
		color: var(--text-muted);
	}
	.custom-select-arrow {
		transition: transform var(--dur-fast) var(--ease);
		display: inline-flex;
	}
	.custom-select-wrap.open .custom-select-arrow {
		transform: rotate(180deg);
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
		max-height: 260px;
		overflow-y: auto;
	}
	.custom-select-option {
		padding: 0.5rem 0.85rem;
		font-size: var(--fs-sm);
		cursor: pointer;
	}
	.custom-select-option.is-placeholder {
		color: var(--text-muted);
	}
	.custom-select-option:hover {
		background: var(--bg-warm);
	}
	.custom-select-option.selected {
		color: var(--accent);
		font-weight: 600;
		background: var(--accent-soft, var(--accent-light));
	}
</style>
