<script lang="ts">
	import { needsSecret } from '$lib/stores/auth';
	import { supplySecret } from '$lib/api';
	import { refreshCars } from '$lib/stores/cars';

	let value = $state('');

	function onSubmit(e: Event) {
		e.preventDefault();
		if (!value) return;
		supplySecret(value);
		needsSecret.set(false);
		value = '';
		refreshCars().catch(() => {});
	}
</script>

{#if $needsSecret}
	<div class="overlay" role="dialog" aria-modal="true">
		<form class="modal" onsubmit={onSubmit}>
			<h2 class="title">API Secret</h2>
			<p class="msg">Enter the shared password to access Car Tracker.</p>
			<input
				class="input"
				type="password"
				bind:value
				autofocus
				autocomplete="off"
				spellcheck="false"
			/>
			<button type="submit" class="btn primary" disabled={!value}>Unlock</button>
		</form>
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
		z-index: 90;
	}
	.modal {
		background: var(--bg-card);
		border-radius: var(--radius-lg);
		padding: 1.5rem 1.75rem;
		min-width: 320px;
		max-width: 400px;
		box-shadow: var(--shadow-xl);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.title {
		font-size: 1.1rem;
	}
	.msg {
		color: var(--text-secondary);
		font-size: var(--fs-sm);
	}
	.input {
		padding: 0.6rem 0.85rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		font-size: var(--fs-md);
	}
	.input:focus {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.btn.primary {
		background: var(--accent);
		color: #fff;
		border: 0;
		border-radius: var(--radius-md);
		padding: 0.55rem 1rem;
		font-weight: 600;
		font-size: var(--fs-sm);
	}
	.btn.primary:disabled {
		opacity: 0.5;
	}
</style>
