import { dbCheckRateLimit } from "@/lib/db";

/**
 * Check if a request should be rate-limited.
 * Uses the DB for persistence across deploys and restarts.
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
  try {
    return dbCheckRateLimit(key, maxRequests, windowMs);
  } catch {
    // If DB is unavailable, fail open (don't block requests)
    return { limited: false, retryAfter: 0 };
  }
}

/** Get client IP from request headers */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
