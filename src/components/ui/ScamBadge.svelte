<script lang="ts">
	import type { ScamRisk } from '$lib/scoring';

	let {
		scam,
		size = 'md'
	}: {
		scam: ScamRisk;
		size?: 'sm' | 'md';
	} = $props();

	const title = $derived(scam.flags.map((f) => `• ${f.label}`).join('\n'));
</script>

{#if scam.level === 'high'}
	<span class="scam-pill high {size}" {title}>
		<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
			<line x1="12" y1="9" x2="12" y2="13" />
			<line x1="12" y1="17" x2="12.01" y2="17" />
		</svg>
		Likely scam
	</span>
{:else if scam.level === 'low'}
	<span class="scam-note {size}">Check: {scam.flags[0]?.label}</span>
{/if}

<style>
	.scam-pill {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 3px 8px;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
		letter-spacing: 0.01em;
	}
	.scam-pill.sm {
		padding: 2px 6px;
		font-size: 0.75rem;
	}
	.scam-note {
		font-size: 0.8rem;
		color: var(--status-negotiating-fg);
	}
	.scam-pill.high {
		background: var(--bad-bg);
		color: var(--bad);
	}
</style>
