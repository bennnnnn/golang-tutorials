import { NextRequest, NextResponse } from "next/server";
import { getUserById, getProgressCount } from "@/lib/db";
import { getAllTutorials } from "@/lib/tutorials";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const id = parseInt(userId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const [user, completedCount] = await Promise.all([
    getUserById(id),
    getProgressCount(id),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const totalTutorials = getAllTutorials().length;
  const isComplete = completedCount >= totalTutorials;

  return NextResponse.json({
    userId: id,
    name: user.name,
    completedCount,
    totalTutorials,
    isComplete,
    issuedAt: isComplete ? user.last_active_at ?? new Date().toISOString() : null,
  });
}
