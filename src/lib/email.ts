/**
 * Transactional email via Resend.
 * Degrades gracefully when RESEND_API_KEY is not set (dev / CI).
 */
import { Resend } from "resend";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@resend.dev";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email] verify-email token for ${to}: ${token}`);
    }
    return;
  }

  const link = `${BASE_URL}/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your email — Go Tutorials",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#0891b2">Verify your email</h2>
        <p>Hi ${name},</p>
        <p>Click the button below to verify your email address.</p>
        <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#0891b2;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Verify email</a>
        <p style="color:#6b7280;font-size:13px">If you didn't sign up for Go Tutorials, you can safely ignore this email.</p>
        <p style="color:#6b7280;font-size:12px">Or copy this link: ${link}</p>
      </div>
    `,
  });
}
