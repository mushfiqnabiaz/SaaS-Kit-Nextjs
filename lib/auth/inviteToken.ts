import { SignJWT, jwtVerify } from "jose";
import { INVITE_TOKEN_EXPIRY_HOURS } from "@/config/constants";
import type { Role } from "@/config/roles";

export interface InviteTokenPayload {
  inviteId: string;
  email: string;
  companyId: string;
  role: Role;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for invite tokens");
  }
  return new TextEncoder().encode(secret);
}

export async function signInviteToken(payload: InviteTokenPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    companyId: payload.companyId,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.inviteId)
    .setIssuedAt()
    .setExpirationTime(`${INVITE_TOKEN_EXPIRY_HOURS}h`)
    .sign(getSecret());
}

export async function verifyInviteToken(token: string): Promise<InviteTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const inviteId = payload.sub;
    const email = payload.email as string | undefined;
    const companyId = payload.companyId as string | undefined;
    const role = payload.role as Role | undefined;

    if (!inviteId || !email || !companyId || !role) {
      return null;
    }

    return { inviteId, email, companyId, role };
  } catch {
    return null;
  }
}
