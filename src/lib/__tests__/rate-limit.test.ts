import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB so rate-limit tests don't need a real database
const mockHits: Record<string, number[]> = {};

vi.mock("../db", () => ({
  dbCheckRateLimit: vi.fn(async (key: string, maxRequests: number, windowMs: number) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    // Prune old hits
    mockHits[key] = (mockHits[key] ?? []).filter((t) => t >= windowStart);
    const hits = mockHits[key];
    if (hits.length >= maxRequests) {
      const oldest = hits[0];
      const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
      return { limited: true, retryAfter: Math.max(1, retryAfter) };
    }
    hits.push(now);
    return { limited: false, retryAfter: 0 };
  }),
}));

import { checkRateLimit, getClientIp } from "../rate-limit";

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of Object.keys(mockHits)) delete mockHits[key];
});

describe("checkRateLimit", () => {
  it("allows requests under the limit", async () => {
    const result = await checkRateLimit("test-key", 3, 60_000);
    expect(result.limited).toBe(false);
    expect(result.retryAfter).toBe(0);
  });

  it("blocks requests over the limit", async () => {
    for (let i = 0; i < 3; i++) {
      await checkRateLimit("test-key", 3, 60_000);
    }
    const result = await checkRateLimit("test-key", 3, 60_000);
    expect(result.limited).toBe(true);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("tracks keys independently", async () => {
    for (let i = 0; i < 3; i++) {
      await checkRateLimit("key-a", 3, 60_000);
    }
    const resultA = await checkRateLimit("key-a", 3, 60_000);
    const resultB = await checkRateLimit("key-b", 3, 60_000);
    expect(resultA.limited).toBe(true);
    expect(resultB.limited).toBe(false);
  });

  it("allows requests after the window expires", async () => {
    // Manually insert old timestamps (outside window)
    mockHits["test-key"] = [Date.now() - 70_000, Date.now() - 65_000, Date.now() - 62_000];
    const result = await checkRateLimit("test-key", 3, 60_000);
    expect(result.limited).toBe(false);
  });

  it("returns retryAfter of at least 1 second", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("test-key", 5, 60_000);
    }
    const result = await checkRateLimit("test-key", 5, 60_000);
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
