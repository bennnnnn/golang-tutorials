import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserById, getProgressCount, getAchievements, getActivityCount } from "@/lib/db";
import { BADGES } from "@/lib/badges";
import { getAllTutorials } from "@/lib/tutorials";

export async function GET() {
  try {
    const tokenUser = await getCurrentUser();
    if (!tokenUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = getUserById(tokenUser.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const completedCount = getProgressCount(tokenUser.userId);
    const achievements = getAchievements(tokenUser.userId);
    const activityCount = getActivityCount(tokenUser.userId);

    return NextResponse.json({
      stats: {
        xp: user.xp,
        streak_days: user.streak_days,
        longest_streak: user.longest_streak,
        completed_count: completedCount,
      total_tutorials: getAllTutorials().length,
        activity_count: activityCount,
        created_at: user.created_at,
        last_active_at: user.last_active_at,
      },
      achievements: achievements,
      all_badges: BADGES,
    });
  } catch (err) {
    console.error("GET /api/profile/stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
