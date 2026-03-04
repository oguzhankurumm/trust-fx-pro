import { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitRecord>();

  /**
   * Returns true if the request should be allowed.
   * @param key      Unique key (e.g. IP + route)
   * @param limit    Max requests in the window
   * @param windowMs Window duration in milliseconds
   */
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (record.count >= limit) return false;

    record.count += 1;
    return true;
  }

  /** Remaining requests for a key */
  remaining(key: string, limit: number): number {
    const record = this.store.get(key);
    if (!record || Date.now() > record.resetAt) return limit;
    return Math.max(0, limit - record.count);
  }
}

const globalForRL = global as unknown as { rateLimiter: RateLimiter };
const limiter = globalForRL.rateLimiter || new RateLimiter();
if (process.env.NODE_ENV !== "production") globalForRL.rateLimiter = limiter;

/** Extract real IP from headers (Vercel / Netlify / standard) */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** Convenience wrapper — returns { allowed, remaining } */
export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const allowed = limiter.check(key, limit, windowMs);
  const remaining = limiter.remaining(key, limit);
  return { allowed, remaining };
}
