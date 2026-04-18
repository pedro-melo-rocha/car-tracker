<script lang="ts">
	import type { CarStatus } from '$lib/types';
	import { STATUS_LABELS } from '$lib/types';

	let { status }: { status: CarStatus | string } = $props();
	const label = $derived(STATUS_LABELS[status as CarStatus] ?? status);
</script>

<span class="status-badge {status}">{label}</span>

<style>
	.status-badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 0.76rem;
		font-weight: 600;
		background: var(--bg);
		color: var(--text-secondary);
		display: inline-block;
		white-space: nowrap;
	}
	.status-badge.to-contact {
		background: var(--bg-warm);
		color: var(--text-muted);
	}
	.status-badge.contacted {
		background: var(--blue-bg);
		color: var(--blue);
	}
	.status-badge.negotiating {
		background: #fff0e5;
		color: #e8873a;
	}
	.status-badge.dismissed {
		background: var(--red-bg);
		color: var(--red);
	}
	.status-badge.final-offer {
		background: var(--green-bg);
		color: var(--green);
	}
</style>
