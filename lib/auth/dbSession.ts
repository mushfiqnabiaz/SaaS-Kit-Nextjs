import { JWT_SESSION_MAX_AGE_SECONDS } from "@/config/constants";
import { generateSecureToken } from "@/lib/auth/tokens";
import { getSessionRepository } from "@/lib/db/factory";

export async function createDbSession(
  userId: string,
  deviceInfo?: string | null,
): Promise<string> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + JWT_SESSION_MAX_AGE_SECONDS * 1000);
  const session = await getSessionRepository().create({
    userId,
    token,
    expiresAt,
    deviceInfo: deviceInfo ?? null,
  });
  return session.id;
}

export async function isSessionValid(sessionId: string | undefined | null): Promise<boolean> {
  if (!sessionId) return true;
  const session = await getSessionRepository().findById(sessionId);
  if (!session) return false;
  return session.expiresAt > new Date();
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await getSessionRepository().deleteAllByUserId(userId);
}
