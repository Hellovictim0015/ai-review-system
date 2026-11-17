import "server-only";

/**
 * Simple in-memory sliding-window rate limiter, keyed by IP.
 * Good enough for one clinic. On Vercel each serverless instance keeps its
 * own memory, so limits are per-instance; use Upstash/Redis if you need a
 * strict global limit.
 */

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 10;

const hits = new Map<string, number[]>();

export function rateLimit(key: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return { ok: false, retryAfterSec: Math.ceil((WINDOW_MS - (now - recent[0])) / 1000) };
  }

  recent.push(now);
  hits.set(key, recent);

  // Keep memory bounded.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
