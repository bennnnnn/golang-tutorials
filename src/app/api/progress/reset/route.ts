import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { resetAllProgress } from "@/lib/db";
import { verifyCsrf } from "@/lib/csrf";

export async function DELETE(request: NextRequest) {
  try {
    const csrfError = await verifyCsrf(request);
    if (csrfError) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await resetAllProgress(user.userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/progress/reset error:", err);
    return NextResponse.json({ error: "Failed to reset progress" }, { status: 500 });
  }
}
