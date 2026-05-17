import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/config/constants";
import { enforceRateLimit, rateLimitKeyFromIp } from "@/lib/api/rateLimitGuard";
import { ROLES, type Role } from "@/config/roles";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { verifyInviteToken } from "@/lib/auth/inviteToken";
import { getCompanyRepository, getInviteRepository, getUserRepository } from "@/lib/db/factory";
import { sendEmail } from "@/lib/email/send";
import { registerApiSchema } from "@/lib/validations/auth";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { uniqueSlug } from "@/lib/utils/slug";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, {
    key: rateLimitKeyFromIp(request, "register"),
    limit: 5,
    window: "1 h",
  });
  if (limited) return limited;

  try {
    const body: unknown = await request.json();
    const parsed = registerApiSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, email, password, companyName, inviteToken } = parsed.data;
    const userRepo = getUserRepository();
    const existing = await userRepo.findByEmail(email);

    if (existing) {
      return NextResponse.json(
        { data: null, error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    if (inviteToken) {
      const payload = await verifyInviteToken(inviteToken);
      if (!payload) {
        return NextResponse.json({ data: null, error: "Invalid or expired invite" }, { status: 400 });
      }

      const inviteRepo = getInviteRepository();
      const invite = await inviteRepo.findByToken(inviteToken);

      if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
        return NextResponse.json({ data: null, error: "Invite is no longer valid" }, { status: 400 });
      }

      if (invite.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { data: null, error: "Email does not match invitation" },
          { status: 400 },
        );
      }

      const user = await userRepo.create({
        name,
        email,
        passwordHash,
        role: payload.role,
        companyId: payload.companyId,
        companyRoleId:
          payload.role === ROLES.USER ? (invite.companyRoleId ?? null) : null,
      });

      await inviteRepo.markUsed(invite.id);

      writeAuditLog({
        actorId: user.id,
        actorRole: user.role,
        action: AUDIT_ACTIONS.INVITE_ACCEPTED,
        resource: "users",
        resourceId: user.id,
        companyId: payload.companyId,
        req: request,
      });

      await sendEmail({
        to: email,
        subject: "Welcome!",
        template: WelcomeEmail({ name }),
      });

      return NextResponse.json({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
        },
        error: null,
      });
    }

    let companyId: string | null = null;
    let role: Role = ROLES.USER;

    if (companyName) {
      const companyRepo = getCompanyRepository();
      const slug = await uniqueSlug(companyName, (s) => companyRepo.findBySlug(s).then(Boolean));

      const user = await userRepo.create({
        name,
        email,
        passwordHash,
        role: ROLES.COMPANY_ADMIN,
        companyId: null,
      });

      const company = await companyRepo.create({
        name: companyName,
        slug,
        ownerId: user.id,
      });

      companyId = company.id;
      role = ROLES.COMPANY_ADMIN;

      const updated = await userRepo.update(user.id, { companyId: company.id });
      if (!updated) {
        return NextResponse.json(
          { data: null, error: "Failed to finalize registration" },
          { status: 500 },
        );
      }

      writeAuditLog({
        actorId: updated.id,
        actorRole: updated.role,
        action: AUDIT_ACTIONS.USER_CREATED,
        resource: "users",
        resourceId: updated.id,
        companyId: company.id,
        req: request,
      });

      writeAuditLog({
        actorId: updated.id,
        actorRole: updated.role,
        action: AUDIT_ACTIONS.COMPANY_CREATED,
        resource: "companies",
        resourceId: company.id,
        companyId: company.id,
        req: request,
      });

      await sendEmail({
        to: email,
        subject: "Welcome!",
        template: WelcomeEmail({ name }),
      });

      return NextResponse.json({
        data: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          companyId: updated.companyId,
        },
        error: null,
      });
    }

    const user = await userRepo.create({
      name,
      email,
      passwordHash,
      role,
      companyId,
    });

    writeAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: AUDIT_ACTIONS.USER_CREATED,
      resource: "users",
      resourceId: user.id,
      companyId: user.companyId,
      req: request,
    });

    await sendEmail({
      to: email,
      subject: "Welcome!",
      template: WelcomeEmail({ name }),
    });

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
      error: null,
    });
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json(
      { data: null, error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
