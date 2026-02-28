import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser, signToken, setAuthCookie, clearAuthCookie } from "@/lib/auth";
import { getUserById, updateUserProfile, updateUserPassword, deleteUser } from "@/lib/db";
import { verifyCsrf } from "@/lib/csrf";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const VALID_AVATARS = ["gopher", "cool", "ninja", "party", "robot", "wizard", "astro", "pirate"];
const VALID_THEMES = ["light", "dark", "system"];

// GET — return full profile
export async function GET() {
  try {
    const tokenUser = await getCurrentUser();
    if (!tokenUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const user = getUserById(tokenUser.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        theme: user.theme,
        xp: user.xp,
        streak_days: user.streak_days,
        longest_streak: user.longest_streak,
        created_at: user.created_at,
        last_active_at: user.last_active_at,
      },
    });
  } catch (err) {
    console.error("GET /api/profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT — update profile fields OR change password
export async function PUT(request: NextRequest) {
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
    const { limited } = checkRateLimit(`profile:put:${ip}:${tokenUser.userId}`, 10, 60_000);
    if (limited) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();

    // Password change
    if (body.currentPassword && body.newPassword) {
      const user = getUserById(tokenUser.userId);
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const valid = await bcrypt.compare(body.currentPassword, user.password_hash);
      if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

      if (typeof body.newPassword !== "string" || body.newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }

      const hash = await bcrypt.hash(body.newPassword, 10);
      updateUserPassword(tokenUser.userId, hash);
      return NextResponse.json({ success: true });
    }

    // Profile update
    const updates: { name?: string; bio?: string; avatar?: string; theme?: string } = {};
    if (body.name && typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
    if (typeof body.bio === "string") updates.bio = body.bio.slice(0, 200);
    if (body.avatar && VALID_AVATARS.includes(body.avatar)) updates.avatar = body.avatar;
    if (body.theme && VALID_THEMES.includes(body.theme)) updates.theme = body.theme;

    updateUserProfile(tokenUser.userId, updates);

    // Re-sign token if name changed
    if (updates.name) {
      const token = await signToken({ userId: tokenUser.userId, email: tokenUser.email, name: updates.name });
      await setAuthCookie(token);
    }

    const user = getUserById(tokenUser.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        theme: user.theme,
        xp: user.xp,
        streak_days: user.streak_days,
        longest_streak: user.longest_streak,
        created_at: user.created_at,
        last_active_at: user.last_active_at,
      },
    });
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — delete account
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

    deleteUser(tokenUser.userId);
    await clearAuthCookie();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
