import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const { limited } = checkRateLimit(`leaderboard:${ip}`, 30, 60_000);
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const users = getLeaderboard(20);
    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
