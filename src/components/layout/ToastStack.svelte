<script lang="ts">
	import { toasts } from '$lib/stores/ui';
</script>

<div class="toast-stack" role="status" aria-live="polite">
	{#each $toasts as t (t.id)}
		<div class="toast {t.variant}">
			<span class="msg">{t.message}</span>
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
	}
	.toast.success {
		border-left: 3px solid var(--green);
	}
	.toast.error {
		border-left: 3px solid var(--red);
	}
	.toast.info {
		border-left: 3px solid var(--blue);
	}
	.msg {
		color: var(--text);
	}
</style>
