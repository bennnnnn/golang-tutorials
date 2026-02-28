// Simple in-memory sliding window rate limiter
// Persists across hot reloads via globalThis

interface RateLimitStore {
  [key: string]: number[];
}

const g = globalThis as unknown as { __rateLimitStore?: RateLimitStore };
if (!g.__rateLimitStore) g.__rateLimitStore = {};

/**
 * Check if a request should be rate-limited.
 * @param key - Unique identifier (e.g., IP + route)
 * @param maxRequests - Max allowed requests in the window
 * @param windowMs - Time window in milliseconds
 * @returns { limited: boolean, retryAfter: number } - retryAfter in seconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { limited: boolean; retryAfter: number } {
  const store = g.__rateLimitStore!;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get existing timestamps and filter to current window
  const timestamps = (store[key] || []).filter((t) => t > windowStart);
  store[key] = timestamps;

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { limited: true, retryAfter: Math.max(1, retryAfter) };
  }

  timestamps.push(now);
  return { limited: false, retryAfter: 0 };
}

/** Get client IP from request headers */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
