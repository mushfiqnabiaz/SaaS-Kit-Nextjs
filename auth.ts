import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { JWT_SESSION_MAX_AGE_SECONDS } from "@/config/constants";
import { ROLES, type Role } from "@/config/roles";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { setTenantCache } from "@/lib/cache/tenantCache";
import { createDbSession, isSessionValid } from "@/lib/auth/dbSession";
import type { AuthTokenPayload } from "@/lib/auth/session";
import { getCompanyRepository, getUserRepository } from "@/lib/db/factory";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

declare module "next-auth" {
  interface User {
    role: Role;
    companyId: string | null;
    plan: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      companyId: string | null;
      plan: string | null;
      emailVerified: Date | null;
    };
    sessionId?: string;
    impersonatedBy?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT extends AuthTokenPayload {}
}

const googleEnabled =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: JWT_SESSION_MAX_AGE_SECONDS },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const userRepo = getUserRepository();
        const user = await userRepo.findByEmail(email);

        if (!user || !user.isActive) {
          return null;
        }

        const requireEmailVerification =
          process.env.REQUIRE_EMAIL_VERIFICATION === "true";

        if (
          requireEmailVerification &&
          !user.emailVerified &&
          user.role !== ROLES.SUPERADMIN
        ) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          writeAuditLog({
            actorId: user.id,
            actorRole: user.role,
            action: AUDIT_ACTIONS.LOGIN_FAILED,
            resource: "users",
            resourceId: user.id,
            companyId: user.companyId,
            req: request,
          });
          return null;
        }

        let plan: string | null = null;
        if (user.companyId) {
          const company = await getCompanyRepository().findById(user.companyId);
          plan = company?.plan ?? null;
          if (company) {
            await setTenantCache(company);
          }
        }

        writeAuditLog({
          actorId: user.id,
          actorRole: user.role,
          action: AUDIT_ACTIONS.LOGIN_SUCCESS,
          resource: "users",
          resourceId: user.id,
          companyId: user.companyId,
          req: request,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          plan,
        };
      },
    }),
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: false,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.id) {
        const sessionId = await createDbSession(user.id);
        token.userId = user.id;
        token.email = user.email ?? "";
        token.role = user.role ?? ROLES.USER;
        token.companyId = user.companyId ?? null;
        token.plan = user.plan ?? null;
        token.sessionId = sessionId;
        return token;
      }

      if (account?.provider === "google" && token.email) {
        const userRepo = getUserRepository();
        const existing = await userRepo.findByEmail(token.email);

        if (existing) {
          let plan: string | null = null;
          if (existing.companyId) {
            const company = await getCompanyRepository().findById(existing.companyId);
            plan = company?.plan ?? null;
            if (company) {
              await setTenantCache(company);
            }
          }

          if (!existing.emailVerified) {
            await userRepo.update(existing.id, { emailVerified: true });
          }

          const sessionId = await createDbSession(existing.id);
          token.userId = existing.id;
          token.role = existing.role;
          token.companyId = existing.companyId;
          token.plan = plan;
          token.sessionId = sessionId;
        }
      }

      if (token.sessionId && token.userId) {
        const valid = await isSessionValid(token.sessionId as string);
        if (!valid) {
          token.userId = "";
          token.sessionId = "";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.userId) {
        return session;
      }

      session.user = {
        id: token.userId as string,
        email: token.email as string,
        name: session.user.name ?? "",
        role: (token.role as Role) ?? ROLES.USER,
        companyId: (token.companyId as string | null) ?? null,
        plan: (token.plan as string | null) ?? null,
        emailVerified: session.user.emailVerified ?? null,
      };
      session.sessionId = token.sessionId as string | undefined;
      if (token.impersonatedBy) {
        session.impersonatedBy = token.impersonatedBy as string;
      }
      return session;
    },
  },
});
