import { enforceRateLimit, rateLimitKeyFromIp } from "@/lib/api/rateLimitGuard";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { sendVerificationEmail } from "@/lib/email/verification";
import { getUserRepository } from "@/lib/db/factory";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, {
    key: rateLimitKeyFromIp(request, "resend-verification"),
    limit: 5,
    window: "1 h",
  });
  if (limited) return limited;

  try {
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    const user = await getUserRepository().findByEmail(parsed.data.email);

    if (user?.isActive && !user.emailVerified) {
      const sent = await sendVerificationEmail(user.id, user.email, user.name);
      if (!sent) {
        return apiError("Could not send verification email. Check SMTP configuration.", 503);
      }
    }

    return apiSuccess({
      message:
        "If an account exists and is unverified, a verification email has been sent.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
