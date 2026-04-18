import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

interface Bucket {
	count: number;
	resetAt: number;
}

const buckets = new Map<string, Bucket>();

function clientKey(event: RequestEvent): string {
	const fwd = event.request.headers.get('x-forwarded-for');
	const ip = (fwd || '').split(',')[0].trim();
	if (ip) return ip;
	try {
		return event.getClientAddress();
	} catch {
		return 'unknown';
	}
}

export function rateLimit(event: RequestEvent): Response | null {
	const key = clientKey(event);
	const now = Date.now();
	const bucket: Bucket = buckets.get(key) ?? { count: 0, resetAt: now + WINDOW_MS };

	if (now > bucket.resetAt) {
		bucket.count = 0;
		bucket.resetAt = now + WINDOW_MS;
	}
	bucket.count += 1;
	buckets.set(key, bucket);

	if (buckets.size > 10_000) {
		for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
	}

	const remaining = Math.max(0, MAX_REQUESTS - bucket.count);
	event.setHeaders({
		'X-RateLimit-Limit': String(MAX_REQUESTS),
		'X-RateLimit-Remaining': String(remaining),
		'X-RateLimit-Reset': String(Math.ceil(bucket.resetAt / 1000))
	});

	if (bucket.count > MAX_REQUESTS) {
		const retry = Math.ceil((bucket.resetAt - now) / 1000);
		return json(
			{ error: 'Too many requests' },
			{
				status: 429,
				headers: {
					'X-RateLimit-Limit': String(MAX_REQUESTS),
					'X-RateLimit-Remaining': '0',
					'X-RateLimit-Reset': String(Math.ceil(bucket.resetAt / 1000)),
					'Retry-After': String(retry)
				}
			}
		);
	}
	return null;
}
