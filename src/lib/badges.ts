import { getProgressCount, getAchievements, unlockAchievement, getBookmarkCount } from "./db";
import { getAllTutorials } from "./tutorials";

export interface BadgeDef {
  key: string;
  name: string;
  description: string;
  icon: string; // emoji
  xpReward: number;
}

export const BADGES: BadgeDef[] = [
  { key: "first_tutorial", name: "First Steps", description: "Complete your first tutorial", icon: "🎯", xpReward: 20 },
  { key: "three_done", name: "Getting Serious", description: "Complete 3 tutorials", icon: "🚀", xpReward: 30 },
  { key: "all_done", name: "Go Master", description: "Complete all tutorials", icon: "🏆", xpReward: 100 },
  { key: "streak_3", name: "On Fire", description: "Maintain a 3-day streak", icon: "🔥", xpReward: 25 },
  { key: "streak_7", name: "Unstoppable", description: "Maintain a 7-day streak", icon: "⚡", xpReward: 50 },
  { key: "streak_30", name: "Legendary", description: "Maintain a 30-day streak", icon: "👑", xpReward: 200 },
  { key: "bookworm", name: "Bookworm", description: "Save 5 code bookmarks", icon: "📚", xpReward: 25 },
  { key: "speedster", name: "Speedster", description: "Complete a tutorial the same day you start", icon: "⏱️", xpReward: 15 },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map((b) => [b.key, b]));

function getTotalTutorials(): number {
  try {
    return getAllTutorials().length;
  } catch {
    return 5; // fallback
  }
}

/**
 * Check all badges for a user and unlock any newly earned ones.
 * Returns list of newly unlocked badge keys.
 */
export async function checkBadges(
  userId: number,
  context: { streakDays?: number; justCompletedSlug?: string; speedster?: boolean } = {}
): Promise<string[]> {
  const [existingArr, completedCount, bookmarkCount] = await Promise.all([
    getAchievements(userId),
    getProgressCount(userId),
    getBookmarkCount(userId),
  ]);

  const existing = new Set(existingArr.map((a) => a.badge_key));
  const totalTutorials = getTotalTutorials();
  const newlyUnlocked: string[] = [];

  const tryUnlock = async (key: string) => {
    if (existing.has(key)) return;
    if (await unlockAchievement(userId, key)) {
      newlyUnlocked.push(key);
    }
  };

  const unlockPromises: Promise<void>[] = [];

  // Progress badges
  if (completedCount >= 1) unlockPromises.push(tryUnlock("first_tutorial"));
  if (completedCount >= 3) unlockPromises.push(tryUnlock("three_done"));
  if (completedCount >= totalTutorials) unlockPromises.push(tryUnlock("all_done"));

  // Streak badges
  const streak = context.streakDays ?? 0;
  if (streak >= 3) unlockPromises.push(tryUnlock("streak_3"));
  if (streak >= 7) unlockPromises.push(tryUnlock("streak_7"));
  if (streak >= 30) unlockPromises.push(tryUnlock("streak_30"));

  // Bookmark badge
  if (bookmarkCount >= 5) unlockPromises.push(tryUnlock("bookworm"));

  // Speedster
  if (context.speedster) unlockPromises.push(tryUnlock("speedster"));

  await Promise.all(unlockPromises);
  return newlyUnlocked;
}
