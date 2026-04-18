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
	const arrow = $derived(active ? ($listSort.asc ? ' ↑' : ' ↓') : '');

	function toggle() {
		listSort.update((s) =>
			s.field === field ? { field, asc: !s.asc } : { field, asc: true }
		);
	}
</script>

<button type="button" class="sort-btn" class:active onclick={toggle}>
	{label}{arrow}
</button>

<style>
	.sort-btn {
		background: transparent;
		border: 0;
		color: var(--text-secondary);
		font-weight: 600;
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		cursor: pointer;
		padding: 0;
	}
	.sort-btn:hover {
		color: var(--text);
	}
	.sort-btn.active {
		color: var(--accent);
	}
</style>
