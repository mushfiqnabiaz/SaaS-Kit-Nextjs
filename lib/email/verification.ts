import { EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS } from "@/config/constants";
import { generateSecureToken, hashToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/send";
import { getEmailVerificationRepository } from "@/lib/db/factory";
import { VerifyEmail } from "@/emails/VerifyEmail";

export async function sendVerificationEmail(
  userId: string,
  email: string,
  name: string,
): Promise<boolean> {
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  );

  await getEmailVerificationRepository().create(userId, tokenHash, expiresAt);

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;

  return sendEmail({
    to: email,
    subject: "Verify your email address",
    template: VerifyEmail({ verifyUrl, name }),
  });
}
