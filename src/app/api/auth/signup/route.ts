import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { setCsrfCookie } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const { limited, retryAfter } = checkRateLimit(`signup:${ip}`, 3, 60_000);
    if (limited) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser(name, email, passwordHash);

    const token = await signToken({ userId: user.id, email: user.email, name: user.name });
    await setAuthCookie(token);

    const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
    setCsrfCookie(res);
    return res;
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
