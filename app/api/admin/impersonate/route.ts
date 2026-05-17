import { NextResponse } from "next/server";
import { encode } from "@auth/core/jwt";
import { getCompanyRepository, getUserRepository } from "@/lib/db/factory";
import { createDbSession } from "@/lib/auth/dbSession";
import { verifyImpersonationToken } from "@/lib/auth/impersonation";
import { getDashboardPath } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }

  const payload = await verifyImpersonationToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
  }

  const user = await getUserRepository().findById(payload.targetUserId);
  if (!user || !user.isActive) {
    return NextResponse.redirect(new URL("/login?error=user_not_found", request.url));
  }

  let plan: string | null = null;
  if (user.companyId) {
    const company = await getCompanyRepository().findById(user.companyId);
    plan = company?.plan ?? null;
  }

  const sessionId = await createDbSession(user.id, "Impersonated session");

  const sessionToken = await encode({
    token: {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      plan,
      sessionId,
      impersonatedBy: payload.actorId,
    },
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "",
    salt: "authjs.session-token",
    maxAge: 15 * 60,
  });

  const response = NextResponse.redirect(
    new URL(getDashboardPath(user.role), request.url),
  );

  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60,
  });

  return response;
}
