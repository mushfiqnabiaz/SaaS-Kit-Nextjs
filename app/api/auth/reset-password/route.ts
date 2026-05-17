import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/config/constants";
import { enforceRateLimit, rateLimitKeyFromIp } from "@/lib/api/rateLimitGuard";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { revokeAllUserSessions } from "@/lib/auth/dbSession";
import { hashToken } from "@/lib/auth/tokens";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import {
  getPasswordResetRepository,
  getUserRepository,
} from "@/lib/db/factory";
import { resetPasswordApiSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, {
    key: rateLimitKeyFromIp(request, "reset-password"),
    limit: 10,
    window: "1 h",
  });
  if (limited) return limited;

  try {
    const body: unknown = await request.json();
    const parsed = resetPasswordApiSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);
    const resetRecord = await getPasswordResetRepository().findByTokenHash(tokenHash);

    if (!resetRecord) {
      return apiError("Invalid or expired reset token", 400);
    }

    const userRepo = getUserRepository();
    const user = await userRepo.findById(resetRecord.userId);

    if (!user || !user.isActive) {
      return apiError("Invalid or expired reset token", 400);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await userRepo.update(user.id, { passwordHash });
    await getPasswordResetRepository().deleteByUserId(user.id);
    await revokeAllUserSessions(user.id);

    writeAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      resource: "users",
      resourceId: user.id,
      companyId: user.companyId,
      req: request,
    });

    return apiSuccess({ message: "Password updated successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
