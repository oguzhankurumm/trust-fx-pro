interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Singleton — shared across requests in a single Node.js process.
// NOTE: for multi-instance Vercel/Netlify deployments use Upstash Redis.
const globalForCache = global as unknown as { memCache: MemoryCache };
export const cache = globalForCache.memCache || new MemoryCache();
if (process.env.NODE_ENV !== "production") globalForCache.memCache = cache;
