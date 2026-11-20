/**
 * Tiny in-process TTL cache for expensive read-only aggregates (dashboard).
 * Any write to doctors/patients calls `invalidate()`, so admins always see
 * their own changes immediately; the TTL only bounds staleness from other
 * instances. For a multi-instance deployment, swap this for Redis.
 */
const store = new Map();

export async function cached(key, ttlMs, compute) {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await compute();
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

export const invalidate = () => store.clear();

/** Express middleware: clear the cache after any successful mutating request. */
export function invalidateOnWrite(req, res, next) {
  if (req.method !== "GET") res.on("finish", () => res.statusCode < 400 && invalidate());
  next();
}
