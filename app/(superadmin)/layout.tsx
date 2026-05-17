import type { ReactNode } from "react";
import { auth } from "@/auth";
import { ROLES } from "@/config/roles";
import { authMono, authSans } from "@/lib/fonts/auth-fonts";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { AdminShell } from "@/components/superadmin/AdminShell";

export default async function SuperadminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <RoleGuard allowedRoles={[ROLES.SUPERADMIN]}>
      <div
        className={`admin-theme admin-grid-bg min-h-screen font-sans ${authSans.variable} ${authMono.variable}`}
      >
        <AdminShell userName={session?.user?.name} userEmail={session?.user?.email}>
          {children}
        </AdminShell>
      </div>
    </RoleGuard>
  );
}
