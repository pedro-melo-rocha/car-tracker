<script lang="ts">
	let { score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' } = $props();

	const px = $derived(size === 'sm' ? 36 : size === 'lg' ? 56 : 46);
	const tone = $derived(score >= 70 ? 'good' : score >= 50 ? 'warn' : 'bad');
	const radius = $derived(px / 2 - 2);
	const circumference = $derived(2 * Math.PI * radius);
	const dash = $derived((circumference * score) / 100);
	const fontSize = $derived(px * 0.4);
</script>

<span
	role="img"
	aria-label="Score {score} out of 100"
	class="score-chip {tone} size-{size}"
	style="width:{px}px;height:{px}px;font-size:{fontSize}px;"
>
	<svg width={px} height={px} class="ring" aria-hidden="true">
		<circle cx={px / 2} cy={px / 2} r={radius} class="track" stroke-width="2" fill="none" />
		<circle
			cx={px / 2}
			cy={px / 2}
			r={radius}
			class="fill"
			stroke-width="2"
			fill="none"
			stroke-linecap="round"
			stroke-dasharray="{dash} {circumference}"
		/>
	</svg>
	<span class="num">{score}</span>
</span>

<style>
	.score-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		font-weight: 600;
		letter-spacing: -0.02em;
		position: relative;
		flex-shrink: 0;
	}
	.score-chip.good {
		background: var(--good-bg);
		color: var(--good);
	}
	.score-chip.warn {
		background: var(--warn-bg);
		color: var(--warn);
	}
	.score-chip.bad {
		background: var(--bad-bg);
		color: var(--bad);
	}
	.ring {
		position: absolute;
		inset: 0;
		transform: rotate(-90deg);
	}
	.track {
		stroke: currentColor;
		opacity: 0.25;
	}
	.fill {
		stroke: currentColor;
	}
	.num {
		position: relative;
		line-height: 1;
	}
</style>
