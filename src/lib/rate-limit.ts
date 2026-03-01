import { dbCheckRateLimit } from "@/lib/db";

/**
 * Check if a request should be rate-limited.
 * Uses the DB for persistence across deploys and restarts.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ limited: boolean; retryAfter: number }> {
  try {
    return await dbCheckRateLimit(key, maxRequests, windowMs);
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
