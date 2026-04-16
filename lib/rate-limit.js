// Lightweight in-memory rate limit per IP. Good enough for a two-user app.
// Note: Fluid Compute may reuse an instance or spin a new one, so the limit
// is best-effort, not a hard global quota. Swap for Upstash if you ever need
// multi-region guarantees.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const buckets = new Map();

function clientKey(req) {
  const fwd = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd || '').split(',')[0].trim();
  return ip || req.socket?.remoteAddress || 'unknown';
}

function rateLimit(req, res) {
  const key = clientKey(req);
  const now = Date.now();
  const bucket = buckets.get(key) ?? { count: 0, resetAt: now + WINDOW_MS };

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
  res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > MAX_REQUESTS) {
    const retry = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retry));
    res.status(429).json({ error: 'Too many requests' });
    return false;
  }
  return true;
}

module.exports = { rateLimit };
