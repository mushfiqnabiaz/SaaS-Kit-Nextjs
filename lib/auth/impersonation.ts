import { SignJWT, jwtVerify } from "jose";

export interface ImpersonationTokenPayload {
  targetUserId: string;
  actorId: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for impersonation tokens");
  }
  return new TextEncoder().encode(secret);
}

export async function signImpersonationToken(
  targetUserId: string,
  actorId: string,
): Promise<string> {
  return new SignJWT({ targetUserId, actorId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function verifyImpersonationToken(
  token: string,
): Promise<ImpersonationTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const targetUserId = payload.targetUserId as string | undefined;
    const actorId = payload.actorId as string | undefined;
    if (!targetUserId || !actorId) return null;
    return { targetUserId, actorId };
  } catch {
    return null;
  }
}
