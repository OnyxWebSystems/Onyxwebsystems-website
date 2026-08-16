const hits = new Map<string, { count: number; resetAt: number }>();

/** Simple in-memory rate limiter for demo webhooks/auth endpoints. */
export function rateLimit(key: string, limit = 60, windowMs = 60_000) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }
  return { ok: true, remaining: limit - entry.count };
}
