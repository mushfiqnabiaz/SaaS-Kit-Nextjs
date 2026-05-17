import { ROLES } from "@/config/roles";
import { verifyInviteToken } from "@/lib/auth/inviteToken";
import type { InviteRecord, UserRecord } from "@/lib/db/interfaces";
import { getInviteRepository, getUserRepository } from "@/lib/db/factory";

export type InviteValidationResult =
  | { ok: true; payload: Awaited<ReturnType<typeof verifyInviteToken>> & object; invite: InviteRecord }
  | { ok: false; error: string };

export async function validateInviteToken(token: string): Promise<InviteValidationResult> {
  const payload = await verifyInviteToken(token);
  if (!payload) {
    return { ok: false, error: "Invalid or expired invite" };
  }

  const inviteRepo = getInviteRepository();
  const invite = await inviteRepo.findByToken(token);

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return { ok: false, error: "Invite is no longer valid" };
  }

  if (invite.email.toLowerCase() !== payload.email.toLowerCase()) {
    return { ok: false, error: "Invite token does not match invitation" };
  }

  return { ok: true, payload, invite };
}

export async function applyInviteToUser(
  user: UserRecord,
  invite: InviteRecord,
  payload: NonNullable<Awaited<ReturnType<typeof verifyInviteToken>>>,
): Promise<UserRecord | null> {
  if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new Error("Email does not match invitation");
  }

  if (user.role === ROLES.SUPERADMIN) {
    throw new Error("Superadmin accounts cannot accept company invites");
  }

  if (user.companyId && user.companyId !== payload.companyId) {
    throw new Error("You must leave your current company before accepting this invite");
  }

  const userRepo = getUserRepository();
  return userRepo.update(user.id, {
    companyId: payload.companyId,
    role: payload.role,
    companyRoleId:
      payload.role === ROLES.USER ? (invite.companyRoleId ?? null) : null,
    emailVerified: true,
  });
}
