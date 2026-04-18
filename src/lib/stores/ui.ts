import { writable, get } from 'svelte/store';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
	id: number;
	message: string;
	variant: ToastVariant;
}

export const toasts = writable<Toast[]>([]);
export const pending = writable<number>(0);

let nextId = 1;

export function showToast(message: string, variant: ToastVariant = 'success', ttlMs = 3500) {
	const id = nextId++;
	toasts.update((list) => {
		const next = [...list, { id, message, variant }];
		return next.length > 3 ? next.slice(next.length - 3) : next;
	});
	setTimeout(() => {
		toasts.update((list) => list.filter((t) => t.id !== id));
	}, ttlMs);
}

export const toast = {
	info: (msg: string) => showToast(msg, 'info'),
	success: (msg: string) => showToast(msg, 'success'),
	error: (msg: string) => showToast(msg, 'error')
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
