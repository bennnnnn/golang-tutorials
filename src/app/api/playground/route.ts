import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { savePlaygroundSnippet, getPlaygroundSnippet } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 10);

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const { limited } = checkRateLimit(`playground:share:${ip}`, 10, 60_000);
  if (limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const user = await getCurrentUser();

  const body = await request.json() as { code?: string };
  if (!body.code || typeof body.code !== "string") {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  if (body.code.length > 64_000) {
    return NextResponse.json({ error: "Code too large (max 64 KB)" }, { status: 413 });
  }

  const shareId = nanoid();
  savePlaygroundSnippet(shareId, body.code, user?.userId);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return NextResponse.json({ shareId, url: `${baseUrl}/playground/${shareId}` }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const snippet = getPlaygroundSnippet(id);
  if (!snippet) return NextResponse.json({ error: "Snippet not found" }, { status: 404 });

  return NextResponse.json(snippet);
}
