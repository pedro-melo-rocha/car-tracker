<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import PlateMark from '$components/ui/PlateMark.svelte';

	const tabs = [
		{ href: '/pipeline', label: 'Pipeline' },
		{ href: '/list', label: 'List' }
	];

	const userEmail = $derived(page.data?.user?.email ?? null);
	let menuOpen = $state(false);
	let menuRef: HTMLDivElement | undefined = $state();

	function openAdd() {
		const url = new URL(page.url);
		url.searchParams.set('edit', 'new');
		goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
	}

	function onDocClick(e: MouseEvent) {
		if (!menuOpen || !menuRef) return;
		if (!menuRef.contains(e.target as Node)) menuOpen = false;
	}

	$effect(() => {
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	});
</script>

<header class="header">
	<div class="inner">
		<a href="/pipeline" class="brand" aria-label="Achado, go to pipeline">
			<PlateMark />
		</a>
		<nav class="nav" aria-label="Views">
			{#each tabs as tab (tab.href)}
				<a
					href={tab.href}
					class="nav-link"
					aria-current={page.url.pathname === tab.href ? 'page' : undefined}
					data-sveltekit-preload-data="hover"
				>
					{tab.label}
				</a>
			{/each}
		</nav>
		<div class="spacer"></div>
		<button type="button" class="add-btn" onclick={openAdd} aria-label="Add car" title="Add car (N)">
			<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			<span class="add-label">Add car</span>
		</button>
		{#if userEmail}
			<div class="user-wrap" bind:this={menuRef}>
				<button
					type="button"
					class="user-btn"
					onclick={() => (menuOpen = !menuOpen)}
					aria-label="Account menu"
					aria-expanded={menuOpen}
				>
					{userEmail.split('@')[0].slice(0, 2).toUpperCase()}
				</button>
				{#if menuOpen}
					<div class="user-menu" role="menu">
						<div class="menu-email">{userEmail}</div>
						<a href="/docs" class="menu-item" role="menuitem" onclick={() => (menuOpen = false)}>How the score works</a>
						<form method="POST" action="/auth/logout">
							<button type="submit" class="menu-item" role="menuitem">Sign out</button>
						</form>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 30;
		background: var(--bg);
		border-bottom: 1px solid var(--rule);
	}
	.inner {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 28px;
		padding: 0 24px;
		height: var(--header-h);
	}
	.brand {
		display: inline-flex;
		align-items: center;
		text-decoration: none;
		border-radius: 6px;
	}
	.spacer {
		flex: 1;
	}
	.nav {
		display: flex;
		align-self: stretch;
		gap: 22px;
	}
	.nav-link {
		display: inline-flex;
		align-items: center;
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--ink-soft);
		text-decoration: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		transition: color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);
	}
	.nav-link:hover {
		color: var(--ink);
	}
	.nav-link[aria-current='page'] {
		color: var(--ink);
		font-weight: 600;
		border-bottom-color: var(--ink);
	}
	.add-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 14px;
		border-radius: 8px;
		background: var(--accent);
		color: #fff;
		border: 0;
		font-size: 0.85rem;
		font-weight: 600;
		transition: background var(--dur-fast) var(--ease);
	}
	.add-btn:hover {
		background: var(--accent-hover);
	}
	.user-wrap {
		position: relative;
	}
	.user-btn {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--card-2);
		border: 1px solid var(--rule);
		color: var(--ink-soft);
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.user-btn:hover {
		background: var(--rule);
		color: var(--ink);
	}
	.user-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 6px);
		min-width: 200px;
		background: var(--card);
		border: 1px solid var(--rule);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		padding: 4px;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.menu-email {
		padding: 6px 10px 8px;
		font-size: 0.8rem;
		color: var(--ink-soft);
		border-bottom: 1px solid var(--rule);
		margin-bottom: 2px;
		word-break: break-all;
	}
	.menu-item {
		text-align: left;
		background: transparent;
		border: 0;
		padding: 0.45rem 0.75rem;
		border-radius: var(--radius-sm);
		font-size: 0.82rem;
		color: var(--ink);
		cursor: pointer;
		width: 100%;
		display: block;
		text-decoration: none;
	}
	.menu-item:hover {
		background: var(--card-2);
	}
	@media (max-width: 640px) {
		.inner {
			gap: 14px;
			padding: 0 12px;
		}
		.nav {
			gap: 14px;
		}
		.add-label {
			display: none;
		}
		.add-btn {
			padding: 8px 10px;
		}
	}
</style>
