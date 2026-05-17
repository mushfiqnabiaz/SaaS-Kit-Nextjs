import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/config/constants";
import { PUBLIC_APP_NAME } from "@/lib/app-config";
import { requireSuperadmin } from "@/lib/api/admin";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { getPlatformSettingsRepository, getUserRepository } from "@/lib/db/factory";
import {
  adminChangePasswordSchema,
  adminFeatureFlagsSchema,
} from "@/lib/validations/admin";

export async function GET() {
  try {
    await requireSuperadmin();
    const settings = await getPlatformSettingsRepository().get();

    return apiSuccess({
      appName: PUBLIC_APP_NAME,
      logoUrl: process.env.NEXT_PUBLIC_LOGO_URL ?? null,
      featureFlags: settings.featureFlags,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireSuperadmin();
    const body: unknown = await request.json();

    if (body && typeof body === "object" && "featureFlags" in body) {
      const parsed = adminFeatureFlagsSchema.safeParse(body);
      if (!parsed.success) {
        return apiError(parsed.error.flatten().fieldErrors, 400);
      }
      const updated = await getPlatformSettingsRepository().updateFeatureFlags(
        parsed.data.featureFlags,
      );
      return apiSuccess({ featureFlags: updated.featureFlags });
    }

    const parsed = adminChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.flatten().fieldErrors, 400);
    }

    const user = await getUserRepository().findById(actor.userId);
    if (!user) return apiError("User not found", 404);

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) return apiError("Current password is incorrect", 400);

    await getUserRepository().update(user.id, {
      passwordHash: await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS),
    });

    return apiSuccess({ message: "Password updated" });
  } catch (error) {
    return handleApiError(error);
  }
}
