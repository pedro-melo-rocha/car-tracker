<script lang="ts">
	let { count = 1 }: { count?: number } = $props();
</script>

{#each Array(count) as _, i (i)}
	<div class="skeleton-card" aria-hidden="true">
		<div class="row top">
			<div class="bar w-60"></div>
			<div class="circle"></div>
		</div>
		<div class="bar w-45"></div>
		<div class="row bottom">
			<div class="bar w-25"></div>
			<div class="bar w-20"></div>
		</div>
	</div>
{/each}

<style>
	.skeleton-card {
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: var(--radius);
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}
	.bar {
		height: 12px;
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
	.circle {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(
			90deg,
			var(--card-2) 0%,
			var(--rule) 50%,
			var(--card-2) 100%
		);
		background-size: 800px 100%;
		animation: shimmer 1.6s linear infinite;
		flex-shrink: 0;
	}
	.w-60 {
		width: 60%;
	}
	.w-45 {
		width: 45%;
	}
	.w-25 {
		width: 25%;
	}
	.w-20 {
		width: 20%;
	}
</style>
