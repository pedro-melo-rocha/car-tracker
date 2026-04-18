<script lang="ts">
	import { dialog, resolveDialog } from '$lib/stores/ui';

	let inputValue = $state('');
	let inputEl: HTMLInputElement | undefined = $state();

	$effect(() => {
		if ($dialog?.kind === 'prompt') {
			inputValue = $dialog.defaultValue ?? '';
			queueMicrotask(() => inputEl?.focus());
		}
	});

	function onCancel() {
		resolveDialog($dialog?.kind === 'confirm' ? false : null);
	}
	function onConfirm() {
		if ($dialog?.kind === 'prompt') resolveDialog(inputValue);
		else resolveDialog(true);
	}
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onCancel();
		if (e.key === 'Enter') onConfirm();
	}
</script>

{#if $dialog}
	<div
		class="overlay"
		onclick={onCancel}
		onkeydown={onKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="modal" onclick={(e) => e.stopPropagation()} role="presentation">
			<h2 class="title">{$dialog.title}</h2>
			{#if $dialog.message}
				<p class="msg">{$dialog.message}</p>
			{/if}
			{#if $dialog.kind === 'prompt'}
				<input
					class="input"
					type="text"
					bind:value={inputValue}
					bind:this={inputEl}
				/>
			{/if}
			<div class="actions">
				<button type="button" class="btn secondary" onclick={onCancel}>
					{$dialog.cancelLabel ?? 'Cancel'}
				</button>
				<button type="button" class="btn primary" onclick={onConfirm}>
					{$dialog.confirmLabel ?? ($dialog.kind === 'confirm' ? 'Confirm' : 'OK')}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: var(--bg-overlay);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 80;
		animation: fadeUp var(--dur) var(--ease);
	}
	.modal {
		background: var(--bg-card);
		border-radius: var(--radius-lg);
		padding: 1.25rem 1.5rem;
		min-width: 320px;
		max-width: 440px;
		box-shadow: var(--shadow-xl);
	}
	.title {
		font-size: 1.05rem;
		margin-bottom: 0.5rem;
	}
	.msg {
		color: var(--text-secondary);
		font-size: var(--fs-sm);
		margin-bottom: 0.75rem;
	}
	.input {
		width: 100%;
		padding: 0.55rem 0.75rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		font-size: var(--fs-md);
		margin-bottom: 0.75rem;
	}
	.input:focus {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}
	.btn {
		padding: 0.45rem 0.9rem;
		border-radius: var(--radius-md);
		border: 0;
		font-size: var(--fs-sm);
		font-weight: 600;
	}
	.btn.primary {
		background: var(--accent);
		color: #fff;
	}
	.btn.primary:hover {
		background: var(--accent-hover);
	}
	.btn.secondary {
		background: var(--bg-warm);
		color: var(--text);
	}
</style>
