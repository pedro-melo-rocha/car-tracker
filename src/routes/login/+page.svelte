<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<div class="login">
	<div class="card">
		<h1>Car Tracker</h1>
		<p class="msg">Sign in to continue.</p>
		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="email"
				name="email"
				placeholder="Email"
				value={form?.email ?? ''}
				required
				autofocus
				autocomplete="email"
			/>
			<input
				type="password"
				name="password"
				placeholder="Password"
				required
				autocomplete="current-password"
			/>
			{#if form?.error}
				<p class="err">{form.error}</p>
			{/if}
			<button type="submit" disabled={submitting}>
				{submitting ? 'Signing in…' : 'Sign in'}
			</button>
		</form>
	</div>
</div>

<style>
	.login {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: var(--bg);
	}
	.card {
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: var(--radius-lg);
		padding: 2rem 1.75rem;
		width: 100%;
		max-width: 380px;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		box-shadow: var(--shadow-lg);
	}
	h1 {
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--ink);
		margin: 0;
	}
	.msg {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.88rem;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	input {
		padding: 0.7rem 0.9rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-md);
		font-size: 0.95rem;
		background: var(--bg);
		color: var(--ink);
		outline: none;
	}
	input:focus {
		border-color: var(--accent);
	}
	button {
		background: var(--accent);
		color: #fff;
		border: 0;
		padding: 0.7rem 1rem;
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		margin-top: 0.25rem;
	}
	button:hover:not(:disabled) {
		background: var(--accent-hover);
	}
	button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
	.err {
		margin: 0;
		color: var(--bad);
		font-size: 0.82rem;
	}
</style>
