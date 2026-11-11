<script lang="ts">
	import { listSort, type ListSortField } from '$lib/stores/filters';

	let {
		label,
		field
	}: {
		label: string;
		field: ListSortField;
	} = $props();

	const active = $derived($listSort.field === field);
	const arrow = $derived($listSort.field === field ? ($listSort.asc ? '↑' : '↓') : '');

	function toggle() {
		listSort.update((s) =>
			s.field === field ? { field, asc: !s.asc } : { field, asc: true }
		);
	}
</script>

<button type="button" class="sort-btn" class:active onclick={toggle}>
	{label}<span class="arrow" aria-hidden="true">{arrow || '↕'}</span>
</button>

<style>
	.sort-btn {
		background: transparent;
		border: 0;
		color: var(--text-secondary);
		font-weight: 600;
		font-size: 0.8rem;
		cursor: pointer;
		padding: 0;
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
		gap: 3px;
	}
	.sort-btn:hover {
		color: var(--text);
	}
	.sort-btn.active {
		color: var(--accent);
	}
	.arrow {
		font-size: 0.7em;
		opacity: 0.35;
		width: 1em;
		text-align: center;
	}
	.sort-btn.active .arrow {
		opacity: 1;
	}
</style>
