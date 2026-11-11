<script lang="ts">
	// Brand mark: the name "Achado" written as a Portuguese number plate (AC-HA-DO),
	// with the blue country band on the left and the yellow year band on the right.
	let { size = 'md' }: { size?: 'sm' | 'md' | 'lg' } = $props();
</script>

<span class="plate {size}" role="img" aria-label="Achado">
	<span class="band country" aria-hidden="true">P</span>
	<span class="text" aria-hidden="true">AC<i>-</i>HA<i>-</i>DO</span>
	<span class="band year" aria-hidden="true"><b>26</b></span>
</span>

<style>
	.plate {
		--h: 26px;
		display: inline-flex;
		align-items: stretch;
		height: var(--h);
		background: #fff;
		border: 1.5px solid var(--plate-ink);
		border-radius: calc(var(--h) * 0.16);
		overflow: hidden;
		line-height: 1;
		flex-shrink: 0;
		box-shadow: inset 0 0 0 1px #fff;
	}
	.plate.sm {
		--h: 22px;
	}
	.plate.lg {
		--h: 44px;
		border-width: 2px;
	}
	.band {
		display: inline-flex;
		justify-content: center;
		width: calc(var(--h) * 0.48);
		font-family: var(--plate-font);
		font-weight: 600;
	}
	.country {
		align-items: flex-end;
		padding-bottom: calc(var(--h) * 0.1);
		background: var(--plate-blue);
		color: #fff;
		font-size: calc(var(--h) * 0.4);
	}
	.year {
		align-items: center;
		background: var(--plate-yellow);
		color: var(--plate-ink);
		font-size: calc(var(--h) * 0.32);
	}
	.year b {
		font-weight: 600;
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		letter-spacing: 0.02em;
	}
	.text {
		display: inline-flex;
		align-items: center;
		padding: 0 calc(var(--h) * 0.3);
		font-family: var(--plate-font);
		font-weight: 600;
		font-size: calc(var(--h) * 0.66);
		letter-spacing: 0.05em;
		color: var(--plate-ink);
	}
	.text i {
		font-style: normal;
		margin: 0 0.06em;
	}
</style>
