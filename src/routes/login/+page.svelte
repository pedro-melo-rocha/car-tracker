<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import PlateMark from '$components/ui/PlateMark.svelte';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Sign in · Achado</title></svelte:head>

<main class="login">
	<div class="panel">
		<PlateMark size="lg" />
		<p class="msg">The shared list of used cars you’re looking at.</p>
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
			<label for="login-email">Email</label>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				id="login-email"
				type="email"
				name="email"
				value={form?.email ?? ''}
				required
				autofocus
				autocomplete="email"
				aria-invalid={form?.error ? 'true' : undefined}
				aria-describedby={form?.error ? 'login-error' : undefined}
			/>
			<label for="login-password">Password</label>
			<input
				id="login-password"
				type="password"
				name="password"
				required
				autocomplete="current-password"
				aria-invalid={form?.error ? 'true' : undefined}
				aria-describedby={form?.error ? 'login-error' : undefined}
			/>
			<p class="err" id="login-error" role="alert">{form?.error ?? ''}</p>
			<button type="submit" disabled={submitting}>
				{submitting ? 'Signing in…' : 'Sign in'}
			</button>
		</form>
	</div>
</main>

<style>
	.login {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: var(--bg);
	}
	.panel {
		width: 100%;
		max-width: 340px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
	}
	.msg {
		margin: 0.25rem 0 0.5rem;
		color: var(--ink-soft);
		font-size: 0.95rem;
		line-height: 1.45;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		width: 100%;
	}
	label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--ink-soft);
		margin-top: 0.35rem;
	}

	input {
		padding: 0.7rem 0.9rem;
		border: 1px solid var(--rule);
		border-radius: var(--radius-md);
		font-size: 0.95rem;
		background: var(--card);
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
		margin-top: 0.75rem;
	}
	button:hover:not(:disabled) {
		background: var(--accent-hover);
	}
	button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
	.err:empty {
		display: none;
	}
	.err {
		margin: 0.25rem 0 0;
		color: var(--bad);
		font-size: 0.82rem;
	}
</style>
