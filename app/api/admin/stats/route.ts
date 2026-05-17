import { requireSuperadmin } from "@/lib/api/admin";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { getAdminDashboardStats } from "@/lib/admin/stats";

export async function GET() {
  try {
    await requireSuperadmin();
    const stats = await getAdminDashboardStats();
    return apiSuccess(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
