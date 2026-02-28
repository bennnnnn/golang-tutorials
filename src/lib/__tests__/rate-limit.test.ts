import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getClientIp } from "../rate-limit";

// Reset the global store between tests
const g = globalThis as unknown as { __rateLimitStore?: Record<string, number[]> };

beforeEach(() => {
  g.__rateLimitStore = {};
});

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const result = checkRateLimit("test-key", 3, 60_000);
    expect(result.limited).toBe(false);
    expect(result.retryAfter).toBe(0);
  });

  it("blocks requests over the limit", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("test-key", 3, 60_000);
    }
    const result = checkRateLimit("test-key", 3, 60_000);
    expect(result.limited).toBe(true);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("key-a", 3, 60_000);
    }
    const resultA = checkRateLimit("key-a", 3, 60_000);
    const resultB = checkRateLimit("key-b", 3, 60_000);
    expect(resultA.limited).toBe(true);
    expect(resultB.limited).toBe(false);
  });

  it("allows requests after the window expires", () => {
    const store = g.__rateLimitStore!;
    // Manually insert old timestamps
    store["test-key"] = [Date.now() - 70_000, Date.now() - 65_000, Date.now() - 62_000];
    const result = checkRateLimit("test-key", 3, 60_000);
    expect(result.limited).toBe(false);
  });

  it("returns retryAfter of at least 1 second", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-key", 5, 60_000);
    }
    const result = checkRateLimit("test-key", 5, 60_000);
    expect(result.limited).toBe(true);
    expect(result.retryAfter).toBeGreaterThanOrEqual(1);
  });
});

describe("getClientIp", () => {
  it("extracts from x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "10.0.0.1" });
    expect(getClientIp(headers)).toBe("10.0.0.1");
  });

  it("returns unknown when no headers", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("unknown");
  });
});
