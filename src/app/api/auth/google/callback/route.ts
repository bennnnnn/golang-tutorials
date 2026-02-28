import { NextRequest, NextResponse } from "next/server";
import {
  getUserByEmail,
  getUserByGoogleId,
  createUserWithGoogle,
  linkGoogleId,
  logActivity,
  updateStreak,
} from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";
import { setCsrfCookie } from "@/lib/csrf";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("oauth_state")?.value;

  // Validate state to prevent CSRF
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${BASE_URL}/?error=oauth_invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/?error=oauth_no_code`);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(`${BASE_URL}/?error=oauth_not_configured`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BASE_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${BASE_URL}/?error=oauth_token_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Get user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${BASE_URL}/?error=oauth_userinfo_failed`);
    }

    const googleUser = await userInfoRes.json();
    const { sub: googleId, email, name } = googleUser;

    if (!googleId || !email) {
      return NextResponse.redirect(`${BASE_URL}/?error=oauth_missing_fields`);
    }

    // Find existing Google user, or link/create
    let user = getUserByGoogleId(googleId);
    if (!user) {
      const existing = getUserByEmail(email);
      if (existing) {
        linkGoogleId(existing.id, googleId);
        user = existing;
      } else {
        user = createUserWithGoogle(
          name ?? email.split("@")[0],
          email,
          googleId
        );
      }
    }

    const token = await signToken({ userId: user.id, email: user.email, name: user.name });
    await setAuthCookie(token);
    logActivity(user.id, "login_google");
    updateStreak(user.id);

    const res = NextResponse.redirect(`${BASE_URL}/`);
    res.cookies.delete("oauth_state");
    setCsrfCookie(res);
    return res;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${BASE_URL}/?error=oauth_failed`);
  }
}
