<script lang="ts">
	import { toasts, dismissToast } from '$lib/stores/ui';
</script>

<div class="toast-stack" role="status" aria-live="polite">
	{#each $toasts as t (t.id)}
		<div class="toast {t.variant}">
			<span class="mark" aria-hidden="true">
				{#if t.variant === 'success'}
					<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12 10 17 19 7" /></svg>
				{:else if t.variant === 'error'}
					<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="7" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
				{:else}
					<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="11" x2="12" y2="17" /><line x1="12" y1="7" x2="12.01" y2="7" /></svg>
				{/if}
			</span>
			<span class="msg">{t.message}</span>
			{#if t.action}
				<button
					type="button"
					class="action"
					onclick={() => {
						t.action!.onClick();
						dismissToast(t.id);
					}}
				>
					{t.action.label}
				</button>
			{/if}
		</div>
	{/each}
</div>

<style>
	.toast-stack {
		position: fixed;
		bottom: 1.25rem;
		right: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 100;
		pointer-events: none;
	}
	.toast {
		background: var(--bg-card);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-lg);
		padding: 0.7rem 1rem;
		border-radius: var(--radius-md);
		min-width: 240px;
		max-width: 360px;
		font-size: var(--fs-sm);
		animation: slideIn var(--dur) var(--ease);
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.action {
		background: transparent;
		border: 0;
		color: var(--accent);
		font-weight: 600;
		font-size: var(--fs-sm);
		cursor: pointer;
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}
	.action:hover {
		background: var(--accent-bg);
	}
	.mark {
		display: inline-flex;
		flex-shrink: 0;
	}
	.toast.success .mark {
		color: var(--good);
	}
	.toast.error .mark {
		color: var(--bad);
	}
	.toast.info .mark {
		color: var(--blue);
	}
	.toast.error {
		border-color: var(--bad-bg);
	}
	.msg {
		flex: 1;
		color: var(--text);
	}
</style>
