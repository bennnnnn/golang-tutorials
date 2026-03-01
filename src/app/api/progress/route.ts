import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProgress, markComplete, markIncomplete, addXp, logActivity, updateStreak, getUserById } from "@/lib/db";
import { checkBadges, BADGE_MAP } from "@/lib/badges";
import { verifyCsrf } from "@/lib/csrf";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ progress: [] });
    }
    const progress = await getProgress(user.userId);
    return NextResponse.json({ progress });
  } catch (err) {
    console.error("GET /api/progress error:", err);
    return NextResponse.json({ progress: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const csrfError = verifyCsrf(request);
    if (csrfError) {
      return NextResponse.json({ error: csrfError }, { status: 403 });
    }

    const ip = getClientIp(request.headers);
    const { limited } = await checkRateLimit(`progress:post:${ip}:${user.userId}`, 60, 60_000);
    if (limited) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { slug, completed } = await request.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    if (completed) {
      await markComplete(user.userId, slug);
      await addXp(user.userId, 10);
      await logActivity(user.userId, "complete", slug);

      const today = new Date().toISOString().slice(0, 10);
      const dbUserBefore = await getUserById(user.userId);
      const isSpeedster = dbUserBefore?.created_at?.startsWith(today) ?? false;

      const { streak_days } = await updateStreak(user.userId);

      const newBadges = await checkBadges(user.userId, {
        streakDays: streak_days,
        justCompletedSlug: slug,
        speedster: isSpeedster,
      });
      for (const key of newBadges) {
        const badge = BADGE_MAP[key];
        if (badge) await addXp(user.userId, badge.xpReward);
      }
    } else {
      await markIncomplete(user.userId, slug);
    }

    const progress = await getProgress(user.userId);
    return NextResponse.json({ progress });
  } catch (err) {
    console.error("POST /api/progress error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
