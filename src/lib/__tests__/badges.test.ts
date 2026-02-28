import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB functions before importing badges
vi.mock("../db", () => ({
  getProgressCount: vi.fn(() => 0),
  getAchievements: vi.fn(() => []),
  unlockAchievement: vi.fn(() => true),
  getBookmarkCount: vi.fn(() => 0),
}));

vi.mock("../tutorials", () => ({
  getAllTutorials: vi.fn(() => [
    { slug: "a" },
    { slug: "b" },
    { slug: "c" },
    { slug: "d" },
    { slug: "e" },
  ]),
}));

import { checkBadges, BADGES, BADGE_MAP } from "../badges";
import * as db from "../db";

const mockGetProgressCount = vi.mocked(db.getProgressCount);
const mockGetAchievements = vi.mocked(db.getAchievements);
const mockGetBookmarkCount = vi.mocked(db.getBookmarkCount);
const mockUnlockAchievement = vi.mocked(db.unlockAchievement);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAchievements.mockReturnValue([]);
  mockGetProgressCount.mockReturnValue(0);
  mockGetBookmarkCount.mockReturnValue(0);
  mockUnlockAchievement.mockReturnValue(true);
});

describe("BADGES", () => {
  it("has 8 badge definitions", () => {
    expect(BADGES).toHaveLength(8);
  });

  it("BADGE_MAP indexes by key", () => {
    expect(BADGE_MAP["first_tutorial"]).toBeDefined();
    expect(BADGE_MAP["first_tutorial"].name).toBe("First Steps");
  });
});

describe("checkBadges", () => {
  it("unlocks first_tutorial when 1 completed", () => {
    mockGetProgressCount.mockReturnValue(1);
    const unlocked = checkBadges(1, { justCompletedSlug: "a" });
    expect(unlocked).toContain("first_tutorial");
  });

  it("unlocks three_done when 3 completed", () => {
    mockGetProgressCount.mockReturnValue(3);
    const unlocked = checkBadges(1);
    expect(unlocked).toContain("first_tutorial");
    expect(unlocked).toContain("three_done");
  });

  it("unlocks all_done when all tutorials completed", () => {
    mockGetProgressCount.mockReturnValue(5);
    const unlocked = checkBadges(1);
    expect(unlocked).toContain("all_done");
  });

  it("does not re-unlock already earned badges", () => {
    mockGetProgressCount.mockReturnValue(3);
    mockGetAchievements.mockReturnValue([
      { badge_key: "first_tutorial", unlocked_at: "2024-01-01" },
    ]);
    const unlocked = checkBadges(1);
    expect(unlocked).not.toContain("first_tutorial");
    expect(unlocked).toContain("three_done");
  });

  it("unlocks streak badges based on context.streakDays", () => {
    const unlocked = checkBadges(1, { streakDays: 7 });
    expect(unlocked).toContain("streak_3");
    expect(unlocked).toContain("streak_7");
    expect(unlocked).not.toContain("streak_30");
  });

  it("unlocks bookworm when 5+ bookmarks", () => {
    mockGetBookmarkCount.mockReturnValue(5);
    const unlocked = checkBadges(1);
    expect(unlocked).toContain("bookworm");
  });

  it("unlocks speedster when context.speedster is true", () => {
    const unlocked = checkBadges(1, { speedster: true });
    expect(unlocked).toContain("speedster");
  });

  it("does not unlock speedster when flag is false", () => {
    const unlocked = checkBadges(1, { speedster: false });
    expect(unlocked).not.toContain("speedster");
  });

  it("returns empty array when nothing new to unlock", () => {
    mockGetAchievements.mockReturnValue(
      BADGES.map((b) => ({ badge_key: b.key, unlocked_at: "2024-01-01" }))
    );
    mockGetProgressCount.mockReturnValue(5);
    mockGetBookmarkCount.mockReturnValue(10);
    const unlocked = checkBadges(1, { streakDays: 30, speedster: true });
    expect(unlocked).toEqual([]);
  });
});
