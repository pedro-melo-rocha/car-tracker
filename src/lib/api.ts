import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { bumpPending, toast } from './stores/ui';

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
		public body?: unknown
	) {
		super(message);
	}
}

export async function apiFetch<T = unknown>(
	path: string,
	init: RequestInit = {}
): Promise<T> {
	if (!browser) throw new Error('apiFetch only runs in the browser');

	bumpPending(1);
	try {
		const headers = new Headers(init.headers);
		if (init.body && !headers.has('content-type')) {
			headers.set('content-type', 'application/json');
		}
		const res = await fetch(path, { ...init, headers, credentials: 'same-origin' });

		if (res.status === 401) {
			const next = encodeURIComponent(window.location.pathname + window.location.search);
			void goto(`/login?next=${next}`);
			throw new ApiError(401, 'Unauthorized');
		}

		return await parseResponse<T>(res);
	} finally {
		bumpPending(-1);
	}
}

async function parseResponse<T>(res: Response): Promise<T> {
	if (res.status === 204) return undefined as T;
	const ct = res.headers.get('content-type') || '';
	const body = ct.includes('application/json') ? await res.json() : await res.text();

	if (!res.ok) {
		const msg =
			typeof body === 'object' && body && 'error' in body
				? String((body as { error: unknown }).error)
				: `HTTP ${res.status}`;
		toast.error(msg);
		throw new ApiError(res.status, msg, body);
	}

	return body as T;
}
