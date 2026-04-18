import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'apiSecret';

const initial = browser ? localStorage.getItem(STORAGE_KEY) : null;

export const apiSecret = writable<string | null>(initial);
export const needsSecret = writable<boolean>(browser && !initial);

if (browser) {
	apiSecret.subscribe((val) => {
		if (val) {
			localStorage.setItem(STORAGE_KEY, val);
			needsSecret.set(false);
		} else {
			localStorage.removeItem(STORAGE_KEY);
			needsSecret.set(true);
		}
	});
}

export function getSecret(): string | null {
	return get(apiSecret);
}

export function clearSecret(): void {
	apiSecret.set(null);
}

export function setSecret(secret: string): void {
	apiSecret.set(secret);
}
