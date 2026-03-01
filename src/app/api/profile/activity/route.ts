import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logActivity, updateStreak, getRecentActivity } from "@/lib/db";
import { checkBadges } from "@/lib/badges";

export async function GET() {
  try {
    const tokenUser = await getCurrentUser();
    if (!tokenUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const activity = await getRecentActivity(tokenUser.userId, 20);
    return NextResponse.json({ activity });
  } catch (err) {
    console.error("GET /api/profile/activity error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenUser = await getCurrentUser();
    if (!tokenUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { action, detail } = await request.json();
    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    await logActivity(tokenUser.userId, action, detail || "");
    const { streak_days } = await updateStreak(tokenUser.userId);
    const newBadges = await checkBadges(tokenUser.userId, { streakDays: streak_days });

    return NextResponse.json({ streak_days, newBadges });
  } catch (err) {
    console.error("POST /api/profile/activity error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
