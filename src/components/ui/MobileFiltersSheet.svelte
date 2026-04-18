<script lang="ts">
	import { listFilters, resetListFilters, type ListFilters } from '$lib/stores/filters';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	function setRange(key: keyof ListFilters, raw: string) {
		const v = raw.trim() === '' ? null : Number(raw);
		listFilters.update((f) => ({ ...f, [key]: v }) as ListFilters);
	}

	function close() {
		open = false;
	}
</script>

{#if open}
	<div
		class="overlay"
		role="dialog"
		aria-modal="true"
		aria-label="Filters"
		tabindex="-1"
		onclick={close}
		onkeydown={(e) => e.key === 'Escape' && close()}
	>
		<div class="sheet" onclick={(e) => e.stopPropagation()} role="presentation">
			<div class="head">
				<h3>Filters</h3>
				<button type="button" class="close" onclick={close} aria-label="Close">×</button>
			</div>

			<label>
				<span>Search</span>
				<input
					type="text"
					placeholder="Title, make, model…"
					value={$listFilters.search}
					oninput={(e) =>
						listFilters.update((f) => ({
							...f,
							search: (e.currentTarget as HTMLInputElement).value
						}))}
				/>
			</label>

			<div class="range-grid">
				<label>
					<span>Year min</span>
					<input
						type="number"
						value={$listFilters.yearMin ?? ''}
						oninput={(e) => setRange('yearMin', (e.currentTarget as HTMLInputElement).value)}
					/>
				</label>
				<label>
					<span>Year max</span>
					<input
						type="number"
						value={$listFilters.yearMax ?? ''}
						oninput={(e) => setRange('yearMax', (e.currentTarget as HTMLInputElement).value)}
					/>
				</label>
				<label>
					<span>Km min</span>
					<input
						type="number"
						value={$listFilters.kmMin ?? ''}
						oninput={(e) => setRange('kmMin', (e.currentTarget as HTMLInputElement).value)}
					/>
				</label>
				<label>
					<span>Km max</span>
					<input
						type="number"
						value={$listFilters.kmMax ?? ''}
						oninput={(e) => setRange('kmMax', (e.currentTarget as HTMLInputElement).value)}
					/>
				</label>
				<label>
					<span>Price min</span>
					<input
						type="number"
						value={$listFilters.priceMin ?? ''}
						oninput={(e) => setRange('priceMin', (e.currentTarget as HTMLInputElement).value)}
					/>
				</label>
				<label>
					<span>Price max</span>
					<input
						type="number"
						value={$listFilters.priceMax ?? ''}
						oninput={(e) => setRange('priceMax', (e.currentTarget as HTMLInputElement).value)}
					/>
				</label>
				<label>
					<span>Score min</span>
					<input
						type="number"
						value={$listFilters.scoreMin ?? ''}
						oninput={(e) => setRange('scoreMin', (e.currentTarget as HTMLInputElement).value)}
					/>
				</label>
				<label>
					<span>Score max</span>
					<input
						type="number"
						value={$listFilters.scoreMax ?? ''}
						oninput={(e) => setRange('scoreMax', (e.currentTarget as HTMLInputElement).value)}
					/>
				</label>
			</div>

			<div class="actions">
				<button type="button" class="btn secondary" onclick={resetListFilters}>Clear all</button>
				<button type="button" class="btn primary" onclick={close}>Apply</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: var(--bg-overlay);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		z-index: 85;
	}
	.sheet {
		background: var(--bg-card);
		width: 100%;
		max-width: 480px;
		border-top-left-radius: var(--radius-lg);
		border-top-right-radius: var(--radius-lg);
		padding: 1rem 1.1rem 1.3rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-height: 85vh;
		overflow-y: auto;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.close {
		background: transparent;
		border: 0;
		font-size: 1.4rem;
		line-height: 1;
		color: var(--text-secondary);
		cursor: pointer;
	}
	label {
		display: flex;
		flex-direction: column;
		font-size: 0.78rem;
		color: var(--text-secondary);
		gap: 4px;
	}
	input {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-sm);
		font-size: var(--fs-sm);
	}
	.range-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		padding-top: 0.25rem;
	}
	.btn {
		padding: 0.5rem 1rem;
		border: 0;
		border-radius: var(--radius-md);
		font-size: var(--fs-sm);
		font-weight: 600;
		cursor: pointer;
	}
	.btn.primary {
		background: var(--accent);
		color: #fff;
	}
	.btn.secondary {
		background: var(--bg-warm);
		color: var(--text);
	}
</style>
