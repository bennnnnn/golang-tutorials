import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserById, getAdminUsers, adminResetUserProgress } from "@/lib/db";
import { verifyCsrf } from "@/lib/csrf";

async function requireAdmin() {
  const token = await getCurrentUser();
  if (!token) return null;
  const user = getUserById(token.userId);
  if (!user || !user.is_admin) return null;
  return user;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users = getAdminUsers();
    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const csrfError = await verifyCsrf(request);
    if (csrfError) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { action, userId } = await request.json() as { action: string; userId: number };

    if (action === "reset_progress") {
      adminResetUserProgress(userId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
