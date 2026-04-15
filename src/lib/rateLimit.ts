// Rate limiter simple en mémoire (par IP ou user_id)
// Reset au redémarrage de l'instance. Pour un vrai rate limit
// distribué, utiliser Upstash Redis.

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, opts: { limit: number; windowMs: number }): { ok: boolean; retryAfter?: number } {
  const now = Date.now()
  const b = buckets.get(key)

  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { ok: true }
  }

  if (b.count >= opts.limit) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) }
  }

  b.count++
  return { ok: true }
}

// Nettoyage périodique (appelé à chaque check) pour éviter fuite mémoire
let lastCleanup = Date.now()
export function cleanupExpired() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return // max 1x/min
  lastCleanup = now
  for (const [k, b] of buckets.entries()) {
    if (b.resetAt < now) buckets.delete(k)
  }
}
