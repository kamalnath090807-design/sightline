interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const limitStore = new Map<string, RateLimitEntry>();

/**
 * Basic in-memory rate limiter per IP/Key and action
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 60 * 1000
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = limitStore.get(key);

  if (!entry || now > entry.resetTime) {
    limitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
