import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, clearAuthCookie } from "@/lib/auth";
import { incrementTokenVersion } from "@/lib/db";
import { verifyCsrf } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  try {
    const csrfError = await verifyCsrf(request);
    if (csrfError) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

    const payload = await getCurrentUser();
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Incrementing token_version invalidates all existing JWTs for this user
    incrementTokenVersion(payload.userId);
    await clearAuthCookie();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/logout-all error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
