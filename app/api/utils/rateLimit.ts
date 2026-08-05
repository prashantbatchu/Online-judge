// Simple in-memory sliding-window rate limiter.
// Good enough for a single-instance deployment / student project; if this
// app is ever deployed across multiple server instances, swap this for a
// shared store (Redis, etc) since each instance would otherwise track its
// own counts.
const buckets = new Map<string, number[]>();

/**
 * Returns true if `key` is allowed to proceed, false if it's over the limit.
 * Automatically prunes old timestamps.
 */
export function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    buckets.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return false;
}
