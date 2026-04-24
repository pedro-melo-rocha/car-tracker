<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Header from '$components/layout/Header.svelte';
	import ToastStack from '$components/layout/ToastStack.svelte';
	import DialogHost from '$components/layout/DialogHost.svelte';
	import PasswordPrompt from '$components/layout/PasswordPrompt.svelte';
	import GlobalSpinner from '$components/layout/GlobalSpinner.svelte';
	import CarDetailPanel from '$components/car/CarDetailPanel.svelte';
	import CarForm from '$components/car/CarForm.svelte';
	import { cars } from '$lib/stores/cars';

	let { children } = $props();

	const isShare = $derived(page.url.pathname.startsWith('/share/'));
	const detailId = $derived(page.url.searchParams.get('car'));
	const editId = $derived(page.url.searchParams.get('edit'));

	const detailCar = $derived(detailId ? $cars.find((c) => c.id === detailId) : undefined);
	const editCar = $derived(
		editId && editId !== 'new' ? $cars.find((c) => c.id === editId) : undefined
	);
	const isEditing = $derived(editId != null);

	function closeOverlay(param: 'car' | 'edit') {
		const url = new URL(page.url);
		url.searchParams.delete(param);
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
</script>

{#if isShare}
	{@render children()}
{:else}
	<Header />

	<main class="main">
		{@render children()}
	</main>

	<ToastStack />
	<DialogHost />
	<PasswordPrompt />
	<GlobalSpinner />
{/if}

{#if !isShare && detailCar}
	<CarDetailPanel
		car={detailCar}
		onclose={() => closeOverlay('car')}
		onedit={(id) => switchToEdit(id)}
	/>
{/if}

{#if !isShare && isEditing}
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
				<h2>{editCar ? 'Edit Car' : 'Add Car'}</h2>
				<button
					type="button"
					class="close-btn"
					onclick={() => closeOverlay('edit')}
					aria-label="Close">×</button
				>
			</div>
			<CarForm car={editCar} onclose={() => closeOverlay('edit')} />
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
