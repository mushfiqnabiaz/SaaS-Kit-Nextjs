import { ROLES } from "@/config/roles";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { signInviteToken } from "@/lib/auth/inviteToken";
import { requirePermission } from "@/lib/auth/rbac";
import { requireApiUser } from "@/lib/api/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { getCompanyRepository, getInviteRepository } from "@/lib/db/factory";
import { sendEmail } from "@/lib/email/send";
import { InviteEmail } from "@/emails/InviteEmail";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await requireApiUser();
    requirePermission(user, "users", "create");

    if (user.role !== ROLES.COMPANY_ADMIN || !user.companyId) {
      return apiError("Forbidden", 403);
    }

    const inviteRepo = getInviteRepository();
    const invite = await inviteRepo.findById(params.id);

    if (!invite || invite.companyId !== user.companyId) {
      return apiError("Invite not found", 404);
    }

    if (invite.usedAt) {
      return apiError("Invite already accepted", 400);
    }

    const company = await getCompanyRepository().findById(user.companyId);
    if (!company?.isActive) {
      return apiError("Company not found or inactive", 400);
    }

    const token = await signInviteToken({
      inviteId: invite.id,
      email: invite.email,
      companyId: user.companyId,
      role: invite.role,
    });

    const updated = await inviteRepo.updateToken(invite.id, token);
    if (!updated) {
      return apiError("Failed to resend invite", 500);
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const inviteUrl = `${baseUrl}/register?token=${encodeURIComponent(token)}`;

    await sendEmail({
      to: invite.email,
      subject: `Reminder: join ${company.name}`,
      template: InviteEmail({ inviteUrl, companyName: company.name }),
    });

    writeAuditLog({
      actorId: user.userId,
      actorRole: user.role,
      action: AUDIT_ACTIONS.USER_INVITED,
      resource: "users",
      resourceId: invite.id,
      companyId: user.companyId,
      req: request,
    });

    return apiSuccess({ id: invite.id, email: invite.email });
  } catch (error) {
    return handleApiError(error);
  }
}
