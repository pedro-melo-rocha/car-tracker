<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Header from '$components/layout/Header.svelte';
	import ToastStack from '$components/layout/ToastStack.svelte';
	import DialogHost from '$components/layout/DialogHost.svelte';
	import GlobalSpinner from '$components/layout/GlobalSpinner.svelte';
	import CarDetailPanel from '$components/car/CarDetailPanel.svelte';
	import CarForm from '$components/car/CarForm.svelte';
	import CompareOverlay from '$components/car/CompareOverlay.svelte';
	import CompareTray from '$components/ui/CompareTray.svelte';
	import { cars } from '$lib/stores/cars';
	import { compareIds, parseCompareParam, removeFromCompare } from '$lib/stores/compare';

	let { children } = $props();

	const isShare = $derived(page.url.pathname.startsWith('/share/'));
	const isLogin = $derived(page.url.pathname.startsWith('/login'));
	const isChrome = $derived(!isShare && !isLogin);
	const detailId = $derived(page.url.searchParams.get('car'));
	const editId = $derived(page.url.searchParams.get('edit'));
	const importUrlParam = $derived(page.url.searchParams.get('importUrl') ?? undefined);

	const detailCar = $derived(detailId ? $cars.find((c) => c.id === detailId) : undefined);
	const editCar = $derived(
		editId && editId !== 'new' ? $cars.find((c) => c.id === editId) : undefined
	);
	const isEditing = $derived(editId != null);
	const compareParam = $derived(page.url.searchParams.get('compare'));
	const compareList = $derived(parseCompareParam(compareParam));
	const isComparing = $derived(compareParam != null);

	// Opening the overlay from a URL also seeds the tray, so closing it keeps the picks.
	$effect(() => {
		if (compareList.length) compareIds.set(compareList);
	});

	// Lock page scroll while any overlay is up, so the board doesn't scroll underneath.
	$effect(() => {
		const locked = isChrome && (!!detailCar || isEditing || isComparing);
		document.body.style.overflow = locked ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});

	function closeCompare() {
		const url = new URL(page.url);
		url.searchParams.delete('compare');
		goto(url.pathname + url.search, { keepFocus: true, noScroll: true, replaceState: true });
	}

	function removeCompared(id: string) {
		removeFromCompare(id);
		const next = compareList.filter((x) => x !== id);
		const url = new URL(page.url);
		if (next.length) url.searchParams.set('compare', next.join(','));
		else url.searchParams.delete('compare');
		goto(url.pathname + url.search, { keepFocus: true, noScroll: true, replaceState: true });
	}

	function openFromCompare(id: string) {
		const url = new URL(page.url);
		url.searchParams.delete('compare');
		url.searchParams.set('car', id);
		goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
	}

	function closeOverlay(param: 'car' | 'edit') {
		const url = new URL(page.url);
		url.searchParams.delete(param);
		if (param === 'edit') url.searchParams.delete('importUrl');
		goto(url.pathname + (url.search ? url.search : ''), {
			keepFocus: true,
			noScroll: true,
			replaceState: true
		});
	}

	function switchToEdit(id: string) {
		const url = new URL(page.url);
		url.searchParams.delete('car');
		url.searchParams.set('edit', id);
		goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
	}

	function isTypingTarget(t: EventTarget | null): boolean {
		if (!(t instanceof HTMLElement)) return false;
		const tag = t.tagName;
		return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
	}

	function onGlobalKeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (isTypingTarget(e.target)) return;
		if (isEditing || detailId || isComparing || isShare) return;

		if (e.key === 'n' || e.key === 'N') {
			e.preventDefault();
			const url = new URL(page.url);
			url.searchParams.set('edit', 'new');
			goto(url.pathname + url.search, { keepFocus: true, noScroll: true });
		} else if (e.key === '/') {
			const search = document.querySelector<HTMLInputElement>('input.search');
			if (search) {
				e.preventDefault();
				search.focus();
				search.select();
			}
		}
	}

	$effect(() => {
		document.addEventListener('keydown', onGlobalKeydown);
		return () => document.removeEventListener('keydown', onGlobalKeydown);
	});
</script>

{#if isChrome}
	<Header />

	<main class="main">
		{@render children()}
	</main>

	{#if !isComparing}<CompareTray />{/if}
	<ToastStack />
	<DialogHost />
	<GlobalSpinner />
{:else}
	{@render children()}
{/if}

{#if isChrome && detailCar}
	<CarDetailPanel
		car={detailCar}
		onclose={() => closeOverlay('car')}
		onedit={(id) => switchToEdit(id)}
	/>
{/if}

{#if isChrome && isComparing}
	<CompareOverlay
		ids={compareList}
		onclose={closeCompare}
		onremove={removeCompared}
		onopen={openFromCompare}
	/>
{/if}

{#if isChrome && isEditing}
	<div class="modal-overlay" role="presentation">
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-label={editCar ? 'Edit car' : 'Add car'}
			tabindex="-1"
			onkeydown={(e) => {
				if (e.key === 'Escape') closeOverlay('edit');
			}}
		>
			<div class="modal-head">
				<h2>{editCar ? 'Edit car' : 'Add a car'}</h2>
				<button
					type="button"
					class="close-btn"
					onclick={() => closeOverlay('edit')}
					aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg></button
				>
			</div>
			<CarForm
				car={editCar}
				initialImportUrl={importUrlParam}
				onclose={() => closeOverlay('edit')}
			/>
		</div>
	</div>
{/if}

<style>
	.main {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem 1.25rem 2rem;
	}
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: var(--bg-overlay);
		z-index: 75;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		overflow-y: auto;
	}
	.modal {
		background: var(--bg-card);
		border-radius: var(--radius-lg);
		padding: 1.25rem 1.5rem 1.5rem;
		width: 100%;
		max-width: 560px;
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
		box-shadow: var(--shadow-xl);
	}
	.modal-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}
	.modal-head h2 {
		font-size: 1.1rem;
	}
	.close-btn {
		background: transparent;
		border: 0;
		font-size: 1.5rem;
		line-height: 1;
		color: var(--text-secondary);
		cursor: pointer;
	}
	@media (max-width: 640px) {
		.main {
			padding: 0.75rem 0.75rem 1.5rem;
		}
		.modal {
			padding: 1rem;
		}
	}
</style>
