import { NextResponse } from "next/server";
import { getUserById } from "@/lib/db";

const startTime = Date.now();

export async function GET() {
  let dbOk = false;
  try {
    // Lightweight check: look up a non-existent user (returns undefined — no throw = DB up)
    getUserById(0);
    dbOk = true;
  } catch {
    dbOk = false;
  }

  return NextResponse.json(
    {
      status: dbOk ? "ok" : "degraded",
      db: dbOk ? "ok" : "error",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: process.env.npm_package_version ?? "0.1.0",
    },
    { status: dbOk ? 200 : 503 }
  );
}
