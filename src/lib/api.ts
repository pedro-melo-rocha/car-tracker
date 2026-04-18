import { browser } from '$app/environment';
import { clearSecret, getSecret, needsSecret, setSecret } from './stores/auth';
import { bumpPending, toast } from './stores/ui';
import { get } from 'svelte/store';

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
		public body?: unknown
	) {
		super(message);
	}
}

let pendingAuthResolver: ((secret: string | null) => void) | null = null;

export function supplySecret(secret: string | null) {
	if (pendingAuthResolver) {
		pendingAuthResolver(secret);
		pendingAuthResolver = null;
	}
}

function waitForSecret(): Promise<string | null> {
	needsSecret.set(true);
	return new Promise((resolve) => {
		pendingAuthResolver = resolve;
	});
}

export async function apiFetch<T = unknown>(
	path: string,
	init: RequestInit = {}
): Promise<T> {
	if (!browser) throw new Error('apiFetch only runs in the browser');

	let secret = getSecret();
	if (!secret) {
		secret = await waitForSecret();
		if (!secret) throw new ApiError(401, 'No API secret');
		setSecret(secret);
	}

	bumpPending(1);
	try {
		const res = await doFetch(path, init, secret);
		if (res.status === 401) {
			clearSecret();
			const newSecret = await waitForSecret();
			if (!newSecret) throw new ApiError(401, 'Unauthorized');
			setSecret(newSecret);
			const retry = await doFetch(path, init, newSecret);
			return await parseResponse<T>(retry);
		}
		return await parseResponse<T>(res);
	} finally {
		bumpPending(-1);
	}
}

async function doFetch(path: string, init: RequestInit, secret: string): Promise<Response> {
	const headers = new Headers(init.headers);
	headers.set('x-api-secret', secret);
	if (init.body && !headers.has('content-type')) {
		headers.set('content-type', 'application/json');
	}
	return fetch(path, { ...init, headers });
}

async function parseResponse<T>(res: Response): Promise<T> {
	if (res.status === 204) return undefined as T;
	const ct = res.headers.get('content-type') || '';
	const body = ct.includes('application/json') ? await res.json() : await res.text();

	if (!res.ok) {
		const msg = typeof body === 'object' && body && 'error' in body ? String((body as { error: unknown }).error) : `HTTP ${res.status}`;
		toast.error(msg);
		throw new ApiError(res.status, msg, body);
	}

	return body as T;
}

void get;
