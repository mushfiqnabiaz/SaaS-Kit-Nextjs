import { ROLES } from "@/config/roles";
import { INVITE_TOKEN_EXPIRY_HOURS } from "@/config/constants";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { signInviteToken } from "@/lib/auth/inviteToken";
import { requirePermission } from "@/lib/auth/rbac";
import { requireApiUser } from "@/lib/api/auth";
import { enforceRateLimit } from "@/lib/api/rateLimitGuard";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { assertCompanyRoleBelongsToCompany } from "@/lib/company/rolesServer";
import { getCompanyRepository, getInviteRepository } from "@/lib/db/factory";
import { sendEmail } from "@/lib/email/send";
import { inviteUserSchema } from "@/lib/validations/user";
import { InviteEmail } from "@/emails/InviteEmail";

export async function GET() {
  try {
    const user = await requireApiUser();
    requirePermission(user, "users", "list");

    if (user.role !== ROLES.COMPANY_ADMIN || !user.companyId) {
      return apiError("Only company admins can list invites", 403);
    }

    const invites = await getInviteRepository().listPending(user.companyId);
    return apiSuccess(
      invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        companyRoleId: inv.companyRoleId,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();

    const limited = await enforceRateLimit(request, {
      key: `invite:${user.companyId ?? user.userId}`,
      limit: 20,
      window: "1 h",
    });
    if (limited) return limited;
    requirePermission(user, "users", "create");

    if (user.role !== ROLES.COMPANY_ADMIN || !user.companyId) {
      return apiError("Only company admins can invite users", 403);
    }

    const body: unknown = await request.json();
    const parsed = inviteUserSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    const company = await getCompanyRepository().findById(user.companyId);
    if (!company?.isActive) {
      return apiError("Company not found or inactive", 400);
    }

    let companyRoleId: string | null = null;
    if (parsed.data.role === ROLES.USER && parsed.data.companyRoleId) {
      const customRole = await assertCompanyRoleBelongsToCompany(
        parsed.data.companyRoleId,
        user.companyId,
      );
      if (!customRole) {
        return apiError("Invalid custom role", 400);
      }
      companyRoleId = customRole.id;
    }

    const inviteRepo = getInviteRepository();
    const expiresAt = new Date(Date.now() + INVITE_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    const invite = await inviteRepo.create({
      email: parsed.data.email,
      companyId: user.companyId,
      role: parsed.data.role,
      companyRoleId,
      token: `pending-${crypto.randomUUID()}`,
      expiresAt,
    });

    const token = await signInviteToken({
      inviteId: invite.id,
      email: parsed.data.email,
      companyId: user.companyId,
      role: parsed.data.role,
    });

    const finalInvite = await inviteRepo.updateToken(invite.id, token);
    if (!finalInvite) {
      return apiError("Failed to create invite", 500);
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const inviteUrl = `${baseUrl}/register?token=${encodeURIComponent(token)}`;

    await sendEmail({
      to: parsed.data.email,
      subject: `You're invited to join ${company.name}`,
      template: InviteEmail({ inviteUrl, companyName: company.name }),
    });

    writeAuditLog({
      actorId: user.userId,
      actorRole: user.role,
      action: AUDIT_ACTIONS.USER_INVITED,
      resource: "users",
      resourceId: finalInvite.id,
      companyId: user.companyId,
      req: request,
    });

    return apiSuccess(
      {
        id: finalInvite.id,
        email: finalInvite.email,
        role: finalInvite.role,
        companyRoleId: finalInvite.companyRoleId,
        expiresAt: finalInvite.expiresAt,
      },
      {},
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
