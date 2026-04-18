<script lang="ts">
	import { scoreClass } from '$lib/scoring';

	let { score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' } = $props();
	const cls = $derived(scoreClass(score));
</script>

<span class="chip-score {cls} size-{size}">{score}</span>

<style>
	.chip-score {
		font-weight: 700;
		padding: 3px 11px;
		border-radius: 999px;
		font-family: var(--mono);
		box-shadow: inset 0 0 0 1px currentColor;
		display: inline-block;
	}
	.chip-score.green {
		background: var(--green-bg);
		color: var(--green);
	}
	.chip-score.yellow {
		background: var(--yellow-bg);
		color: var(--yellow);
	}
	.chip-score.red {
		background: var(--red-bg);
		color: var(--red);
	}
	.size-sm {
		font-size: 0.72rem;
		padding: 2px 8px;
	}
	.size-md {
		font-size: 0.78rem;
	}
	.size-lg {
		font-size: 0.95rem;
		padding: 4px 14px;
	}
</style>
