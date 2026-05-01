import { writable, get } from 'svelte/store';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastAction {
	label: string;
	onClick: () => void;
}

export interface Toast {
	id: number;
	message: string;
	variant: ToastVariant;
	action?: ToastAction;
}

export const toasts = writable<Toast[]>([]);
export const pending = writable<number>(0);

let nextId = 1;

export function dismissToast(id: number) {
	toasts.update((list) => list.filter((t) => t.id !== id));
}

export function showToast(
	message: string,
	variant: ToastVariant = 'success',
	ttlMs = 3500,
	action?: ToastAction
): number {
	const id = nextId++;
	toasts.update((list) => {
		const next = [...list, { id, message, variant, action }];
		return next.length > 3 ? next.slice(next.length - 3) : next;
	});
	setTimeout(() => dismissToast(id), ttlMs);
	return id;
}

export const toast = {
	info: (msg: string) => showToast(msg, 'info'),
	success: (msg: string) => showToast(msg, 'success'),
	error: (msg: string) => showToast(msg, 'error'),
	action: (msg: string, action: ToastAction, ttlMs = 6000, variant: ToastVariant = 'info') =>
		showToast(msg, variant, ttlMs, action)
};

export function bumpPending(delta: number) {
	pending.update((n) => Math.max(0, n + delta));
}

export interface DialogRequest {
	kind: 'confirm' | 'prompt';
	title: string;
	message?: string;
	defaultValue?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	resolve: (value: string | boolean | null) => void;
}

export const dialog = writable<DialogRequest | null>(null);

export function confirmDialog(opts: {
	title: string;
	message?: string;
	confirmLabel?: string;
	cancelLabel?: string;
}): Promise<boolean> {
	return new Promise((resolve) => {
		dialog.set({
			kind: 'confirm',
			title: opts.title,
			message: opts.message,
			confirmLabel: opts.confirmLabel,
			cancelLabel: opts.cancelLabel,
			resolve: (v) => resolve(v === true)
		});
	});
}

export function promptDialog(opts: {
	title: string;
	message?: string;
	defaultValue?: string;
	confirmLabel?: string;
	cancelLabel?: string;
}): Promise<string | null> {
	return new Promise((resolve) => {
		dialog.set({
			kind: 'prompt',
			title: opts.title,
			message: opts.message,
			defaultValue: opts.defaultValue,
			confirmLabel: opts.confirmLabel,
			cancelLabel: opts.cancelLabel,
			resolve: (v) => resolve(typeof v === 'string' ? v : null)
		});
	});
}

export function resolveDialog(value: string | boolean | null) {
	const current = get(dialog);
	if (!current) return;
	current.resolve(value);
	dialog.set(null);
}
