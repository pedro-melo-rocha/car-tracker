<script lang="ts">
	let { count = 6, columns = 10 }: { count?: number; columns?: number } = $props();
</script>

{#each Array(count) as _, i (i)}
	<tr class="skeleton-row" aria-hidden="true">
		<td colspan={columns}>
			<div class="bar"></div>
		</td>
	</tr>
{/each}

<style>
	.skeleton-row {
		background: var(--card);
	}
	.skeleton-row td {
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		padding: 14px 18px;
	}
	.bar {
		height: 14px;
		background: linear-gradient(
			90deg,
			var(--card-2) 0%,
			var(--rule) 50%,
			var(--card-2) 100%
		);
		background-size: 800px 100%;
		animation: shimmer 1.6s linear infinite;
		border-radius: 4px;
	}
</style>
