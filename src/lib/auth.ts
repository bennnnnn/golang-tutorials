import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getUserById } from "@/lib/db";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required in production");
}

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "go-tutorials-dev-secret-key-local"
);

const COOKIE_NAME = "auth_token";

export interface TokenPayload {
  userId: number;
  email: string;
  name: string;
  tokenVersion: number;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  // Verify token version matches DB — invalidates all sessions on logout-all
  const user = await getUserById(payload.userId);
  if (!user) return null;
  if ((user.token_version ?? 0) !== (payload.tokenVersion ?? 0)) return null;

  return payload;
}
