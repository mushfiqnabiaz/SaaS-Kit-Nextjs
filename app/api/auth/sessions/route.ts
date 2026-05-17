import { auth } from "@/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { getSessionRepository } from "@/lib/db/factory";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Authentication required", 401);
    }

    const sessions = await getSessionRepository().listByUserId(session.user.id);
    const currentSessionId = session.sessionId;

    return apiSuccess(
      sessions.map((s) => ({
        id: s.id,
        deviceInfo: s.deviceInfo ?? "Unknown device",
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.id === currentSessionId,
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Authentication required", 401);
    }

    const count = await getSessionRepository().deleteAllByUserId(session.user.id);
    return apiSuccess({ revoked: count });
  } catch (error) {
    return handleApiError(error);
  }
}
