import { NextResponse } from "next/server";
import { z } from "zod";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { requireApiUser } from "@/lib/api/auth";
import {
  applyInviteToUser,
  validateInviteToken,
} from "@/lib/auth/inviteAccept";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { getInviteRepository, getUserRepository } from "@/lib/db/factory";

const acceptBodySchema = z.object({
  token: z.string().min(1),
});

/** Validates invite and sends new users to registration; existing users must sign in and POST. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(new URL("/register", baseUrl));
  }

  const validated = await validateInviteToken(token);
  if (!validated.ok) {
    return NextResponse.redirect(new URL("/login?error=invalid_invite", baseUrl));
  }

  const existing = await getUserRepository().findByEmail(validated.payload.email);

  if (existing) {
    const loginUrl = new URL("/login", baseUrl);
    loginUrl.searchParams.set("invite", token);
    loginUrl.searchParams.set("email", validated.payload.email);
    return NextResponse.redirect(loginUrl);
  }

  const registerUrl = new URL("/register", baseUrl);
  registerUrl.searchParams.set("token", token);
  registerUrl.searchParams.set("email", validated.payload.email);
  return NextResponse.redirect(registerUrl);
}

/** Authenticated invite acceptance — user must be logged in with matching email. */
export async function POST(request: Request) {
  try {
    const sessionUser = await requireApiUser();
    const body: unknown = await request.json();
    const parsed = acceptBodySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    const validated = await validateInviteToken(parsed.data.token);
    if (!validated.ok) {
      return apiError(validated.error, 400);
    }

    const user = await getUserRepository().findById(sessionUser.userId);
    if (!user) {
      return apiError("User not found", 404);
    }

    if (user.email.toLowerCase() !== validated.invite.email.toLowerCase()) {
      return apiError("Sign in with the email address that received the invitation", 403);
    }

    try {
      const updated = await applyInviteToUser(user, validated.invite, validated.payload);
      if (!updated) {
        return apiError("Failed to accept invite", 500);
      }

      await getInviteRepository().markUsed(validated.invite.id);

      writeAuditLog({
        actorId: updated.id,
        actorRole: updated.role,
        action: AUDIT_ACTIONS.INVITE_ACCEPTED,
        resource: "users",
        resourceId: updated.id,
        companyId: validated.payload.companyId,
        req: request,
      });

      return apiSuccess({
        id: updated.id,
        companyId: updated.companyId,
        role: updated.role,
        companyRoleId: updated.companyRoleId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Cannot accept invite";
      return apiError(message, 400);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
