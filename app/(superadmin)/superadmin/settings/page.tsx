import { auth } from "@/auth";
import { SettingsPageClient } from "@/components/superadmin/SettingsPageClient";
import { PUBLIC_APP_NAME } from "@/lib/app-config";
import { getSettingsPageData } from "@/lib/data/superadmin";

export default async function SuperadminSettingsPage() {
  const [session, settings] = await Promise.all([auth(), getSettingsPageData()]);

  return (
    <SettingsPageClient
      appName={PUBLIC_APP_NAME}
      logoUrl={process.env.NEXT_PUBLIC_LOGO_URL ?? null}
      initialFeatureFlags={settings.featureFlags}
      updatedAt={settings.updatedAt}
      userEmail={session?.user?.email}
      dbDriver={process.env.DB_DRIVER ?? "mongo"}
      nodeEnv={process.env.NODE_ENV ?? "development"}
    />
  );
}
