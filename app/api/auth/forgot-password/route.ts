import { NextResponse } from "next/server";
import { PASSWORD_RESET_TOKEN_EXPIRY_HOURS } from "@/config/constants";
import { enforceRateLimit } from "@/lib/api/rateLimitGuard";
import { apiSuccess } from "@/lib/api/response";
import { generateSecureToken, hashToken } from "@/lib/auth/tokens";
import { getPasswordResetRepository, getUserRepository } from "@/lib/db/factory";
import { sendEmail } from "@/lib/email/send";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { PasswordResetEmail } from "@/emails/PasswordResetEmail";

export async function POST(request: Request) {
  const body: unknown = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const limited = await enforceRateLimit(request, {
    key: `forgot-password:${parsed.data.email.toLowerCase()}`,
    limit: 3,
    window: "1 h",
  });
  if (limited) return limited;

  const { email } = parsed.data;
  const user = await getUserRepository().findByEmail(email);

  if (user?.isActive) {
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await getPasswordResetRepository().create(user.id, tokenHash, expiresAt);

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      template: PasswordResetEmail({ resetUrl, name: user.name }),
    });
  }

  return apiSuccess({
    message: "If an account exists for that email, you will receive reset instructions shortly.",
  });
}
