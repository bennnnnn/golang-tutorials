import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBookmarks, getBookmarkTotal, addBookmark, deleteBookmark } from "@/lib/db";
import { checkBadges } from "@/lib/badges";
import { verifyCsrf } from "@/lib/csrf";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  try {
    const tokenUser = await getCurrentUser();
    if (!tokenUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);
    const bookmarks = getBookmarks(tokenUser.userId, PAGE_SIZE, offset);
    const total = getBookmarkTotal(tokenUser.userId);
    return NextResponse.json({ bookmarks, total, hasMore: offset + PAGE_SIZE < total });
  } catch (err) {
    console.error("GET /api/bookmarks error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenUser = await getCurrentUser();
    if (!tokenUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const csrfError = verifyCsrf(request);
    if (csrfError) {
      return NextResponse.json({ error: csrfError }, { status: 403 });
    }

    const ip = getClientIp(request.headers);
    const { limited } = checkRateLimit(`bookmarks:post:${ip}:${tokenUser.userId}`, 30, 60_000);
    if (limited) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { tutorialSlug, snippet, note } = await request.json();
    if (!tutorialSlug || typeof tutorialSlug !== "string" || !snippet || typeof snippet !== "string") {
      return NextResponse.json({ error: "tutorialSlug and snippet are required" }, { status: 400 });
    }

    const bookmark = addBookmark(tokenUser.userId, tutorialSlug, snippet, note || "");

    // Check bookworm badge
    checkBadges(tokenUser.userId);

    return NextResponse.json({ bookmark });
  } catch (err) {
    console.error("POST /api/bookmarks error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tokenUser = await getCurrentUser();
    if (!tokenUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const csrfError = verifyCsrf(request);
    if (csrfError) {
      return NextResponse.json({ error: csrfError }, { status: 403 });
    }

    const ip = getClientIp(request.headers);
    const { limited } = checkRateLimit(`bookmarks:delete:${ip}:${tokenUser.userId}`, 30, 60_000);
    if (limited) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const id = body?.id;
    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    deleteBookmark(tokenUser.userId, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/bookmarks error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
