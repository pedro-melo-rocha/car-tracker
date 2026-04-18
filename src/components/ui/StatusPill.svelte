<script lang="ts">
	import type { CarStatus } from '$lib/types';
	import { STATUS_LABELS } from '$lib/types';

	let { status }: { status: CarStatus | string } = $props();
	const label = $derived(STATUS_LABELS[status as CarStatus] ?? status);
</script>

<span class="status-pill {status}">
	<span class="dot"></span>
	{label}
</span>

<style>
	.status-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 3px 10px;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 500;
		white-space: nowrap;
		background: var(--bg-warm);
		color: var(--text-secondary);
	}
	.dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: currentColor;
		flex-shrink: 0;
	}
	.status-pill.to-contact {
		background: var(--status-to-contact-bg);
		color: var(--status-to-contact-fg);
	}
	.status-pill.contacted {
		background: var(--status-contacted-bg);
		color: var(--status-contacted-fg);
	}
	.status-pill.negotiating {
		background: var(--status-negotiating-bg);
		color: var(--status-negotiating-fg);
	}
	.status-pill.final-offer {
		background: var(--status-final-offer-bg);
		color: var(--status-final-offer-fg);
	}
	.status-pill.dismissed {
		background: var(--status-dismissed-bg);
		color: var(--status-dismissed-fg);
	}
</style>
