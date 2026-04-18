<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const tabs = [
		{ href: '/pipeline', label: 'Pipeline' },
		{ href: '/list', label: 'List' },
		{ href: '/compare', label: 'Compare' },
		{ href: '/docs', label: 'Docs' }
	];

	function openAdd() {
		const url = new URL(page.url);
		url.searchParams.set('edit', 'new');
		goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
	}
</script>

<header class="header">
	<div class="inner">
		<a href="/pipeline" class="brand">Car Tracker</a>
		<nav class="tabs">
			{#each tabs as tab (tab.href)}
				<a href={tab.href} class="tab" class:active={page.url.pathname === tab.href}>
					{tab.label}
				</a>
			{/each}
		</nav>
		<button type="button" class="add-btn" onclick={openAdd}>+ Add Car</button>
	</div>
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 30;
		background: var(--bg);
		border-bottom: 1px solid var(--border);
	}
	.inner {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 1.25rem;
		padding: 0.75rem 1.25rem;
	}
	.brand {
		font-weight: 800;
		font-size: 1.1rem;
		color: var(--text);
		text-decoration: none;
		margin-right: 0.5rem;
	}
	.tabs {
		display: flex;
		gap: 0.25rem;
		flex: 1;
	}
	.tab {
		padding: 0.45rem 0.85rem;
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		text-decoration: none;
		font-size: var(--fs-md);
		font-weight: 500;
		transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
	}
	.tab:hover {
		background: var(--bg-warm);
		color: var(--text);
	}
	.tab.active {
		background: var(--accent-light);
		color: var(--accent);
	}
	.add-btn {
		background: var(--accent);
		color: #fff;
		border: 0;
		border-radius: var(--radius-md);
		padding: 0.55rem 1rem;
		font-weight: 600;
		font-size: var(--fs-sm);
		transition: background var(--dur-fast) var(--ease);
	}
	.add-btn:hover {
		background: var(--accent-hover);
	}
	@media (max-width: 640px) {
		.inner {
			flex-wrap: wrap;
			gap: 0.5rem;
			padding: 0.6rem 0.75rem;
		}
		.brand {
			flex: 0 0 auto;
		}
		.add-btn {
			padding: 0.4rem 0.7rem;
		}
		.tabs {
			order: 3;
			width: 100%;
			overflow-x: auto;
		}
	}
</style>
