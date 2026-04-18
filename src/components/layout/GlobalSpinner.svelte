<script lang="ts">
	import { pending } from '$lib/stores/ui';

	let visible = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if ($pending > 0) {
			if (!timer) timer = setTimeout(() => (visible = true), 150);
		} else {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			visible = false;
		}
	});
</script>

{#if visible}
	<div class="spinner-wrap" aria-hidden="true">
		<div class="spinner"></div>
	</div>
{/if}

<style>
	.spinner-wrap {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 70;
	}
	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid var(--border-strong);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 800ms linear infinite;
	}
</style>
