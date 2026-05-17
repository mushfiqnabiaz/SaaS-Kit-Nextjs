import { NextResponse } from "next/server";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { verifyInviteToken } from "@/lib/auth/inviteToken";
import { getInviteRepository, getUserRepository } from "@/lib/db/factory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(new URL("/register", baseUrl));
  }

  const payload = await verifyInviteToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login?error=invalid_invite", baseUrl));
  }

  const inviteRepo = getInviteRepository();
  const invite = await inviteRepo.findByToken(token);

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/login?error=expired_invite", baseUrl));
  }

  const userRepo = getUserRepository();
  const existing = await userRepo.findByEmail(payload.email);

  if (existing) {
    await userRepo.update(existing.id, {
      companyId: payload.companyId,
      role: payload.role,
    });
    await inviteRepo.markUsed(invite.id);

    writeAuditLog({
      actorId: existing.id,
      actorRole: existing.role,
      action: AUDIT_ACTIONS.INVITE_ACCEPTED,
      resource: "users",
      resourceId: existing.id,
      companyId: payload.companyId,
      req: request,
    });

    return NextResponse.redirect(new URL("/login?invited=1", baseUrl));
  }

  const registerUrl = new URL("/register", baseUrl);
  registerUrl.searchParams.set("token", token);
  registerUrl.searchParams.set("email", payload.email);
  return NextResponse.redirect(registerUrl);
}
