import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserById, getProgress, getAchievements, getBookmarks, getRecentActivity } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [dbUser, progress, achievements, bookmarks, activity] = await Promise.all([
      getUserById(user.userId),
      getProgress(user.userId),
      getAchievements(user.userId),
      getBookmarks(user.userId, 1000, 0),
      getRecentActivity(user.userId, 100),
    ]);

    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        avatar: dbUser.avatar,
        bio: dbUser.bio,
        xp: dbUser.xp,
        streak_days: dbUser.streak_days,
        longest_streak: dbUser.longest_streak,
        created_at: dbUser.created_at,
        last_active_at: dbUser.last_active_at,
      },
      progress,
      achievements,
      bookmarks,
      activity,
    };

    const json = JSON.stringify(exportData, null, 2);

    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="go-tutorials-data-${user.userId}.json"`,
      },
    });
  } catch (err) {
    console.error("GET /api/profile/export error:", err);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
