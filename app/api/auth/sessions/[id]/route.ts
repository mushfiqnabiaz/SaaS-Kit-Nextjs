import { auth } from "@/auth";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { getSessionRepository } from "@/lib/db/factory";

interface RouteParams {
  params: { id: string };
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Authentication required", 401);
    }

    const target = await getSessionRepository().findById(params.id);
    if (!target || target.userId !== session.user.id) {
      return apiError("Session not found", 404);
    }

    await getSessionRepository().deleteById(params.id);
    return apiSuccess({ revoked: true });
  } catch (error) {
    return handleApiError(error);
  }
}
