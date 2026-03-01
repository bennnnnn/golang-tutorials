import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { getUserById, createEmailVerificationToken } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const { limited } = await checkRateLimit(`resend-verify:${ip}`, 3, 300_000); // 3 per 5 min
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const tokenPayload = await getCurrentUser();
  if (!tokenPayload) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await getUserById(tokenPayload.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.email_verified) {
    return NextResponse.json({ message: "Already verified" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  await createEmailVerificationToken(user.id, token);

  sendVerificationEmail(user.email, user.name, token).catch((err) => {
    console.error("Failed to resend verification email:", err);
  });

  return NextResponse.json({ message: "Verification email sent" });
}
