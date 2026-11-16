interface RateLimitRecord {
  hits: number[]
}

const memoryStore = new Map<string, RateLimitRecord>()

/**
 * Checks a sliding window rate limit.
 * @param key unique identifier (e.g. `otp:01012345678` or `ip:127.0.0.1`)
 * @param maxHits maximum allowed hits within the window
 * @param windowMs window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxHits: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now()
  const cutoff = now - windowMs

  let record = memoryStore.get(key)
  if (!record) {
    record = { hits: [] }
    memoryStore.set(key, record)
  }

  // Filter out hits older than window
  record.hits = record.hits.filter((ts) => ts > cutoff)

  if (record.hits.length >= maxHits) {
    const oldest = record.hits[0] ?? now
    const resetMs = Math.max(0, oldest + windowMs - now)
    return {
      allowed: false,
      remaining: 0,
      resetMs,
    }
  }

  record.hits.push(now)
  return {
    allowed: true,
    remaining: maxHits - record.hits.length,
    resetMs: windowMs,
  }
}
