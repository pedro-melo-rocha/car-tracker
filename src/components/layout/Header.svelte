<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const tabs = [
		{ href: '/pipeline', label: 'Pipeline' },
		{ href: '/list', label: 'List' },
		{ href: '/compare', label: 'Compare' },
		{ href: '/score-lab', label: 'Score Lab' },
		{ href: '/docs', label: 'Docs' }
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
		<a href="/pipeline" class="brand">
			<span class="brand-mark" aria-hidden="true"></span>
			<span class="brand-name">Car Tracker</span>
		</a>
		<div class="spacer"></div>
		<nav class="switcher" aria-label="Views">
			{#each tabs as tab (tab.href)}
				<a
					href={tab.href}
					class="seg"
					class:active={page.url.pathname === tab.href}
					data-sveltekit-preload-data="hover"
				>
					{tab.label}
				</a>
			{/each}
		</nav>
		<button type="button" class="add-btn" onclick={openAdd}>
			<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			Add car
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
						<form method="POST" action="/auth/logout">
							<button type="submit" class="menu-item">Sign out</button>
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
		background: rgba(255, 255, 255, 0.72);
		backdrop-filter: saturate(160%) blur(8px);
		-webkit-backdrop-filter: saturate(160%) blur(8px);
		border-bottom: 1px solid var(--rule);
	}
	.inner {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 24px;
	}
	.brand {
		display: inline-flex;
		align-items: baseline;
		gap: 10px;
		text-decoration: none;
		color: var(--ink);
	}
	.brand-mark {
		width: 10px;
		height: 10px;
		background: var(--accent);
		display: inline-block;
		transform: rotate(45deg) translateY(1px);
		border-radius: 2px;
	}
	.brand-name {
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.spacer {
		flex: 1;
	}
	.switcher {
		display: flex;
		background: var(--card-2);
		padding: 3px;
		border-radius: 10px;
		border: 1px solid var(--rule);
		gap: 2px;
	}
	.seg {
		padding: 5px 14px;
		border-radius: 8px;
		font-size: 0.78rem;
		font-weight: 500;
		color: var(--ink-soft);
		text-decoration: none;
		transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
	}
	.seg:hover {
		color: var(--ink);
	}
	.seg.active {
		background: var(--card);
		color: var(--ink);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
	}
	.add-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 14px;
		border-radius: 10px;
		background: var(--accent);
		color: #fff;
		border: 0;
		font-size: 0.78rem;
		font-weight: 500;
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
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		padding: 4px;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.menu-email {
		padding: 6px 10px 8px;
		font-size: 0.72rem;
		color: var(--ink-dim);
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
	}
	.menu-item:hover {
		background: var(--card-2);
	}
	@media (max-width: 640px) {
		.inner {
			flex-wrap: wrap;
			gap: 8px;
			padding: 10px 14px;
		}
		.spacer {
			display: none;
		}
		.switcher {
			order: 3;
			width: 100%;
			overflow-x: auto;
		}
		.seg {
			padding: 5px 10px;
		}
	}
</style>
