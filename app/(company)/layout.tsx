import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLES } from "@/config/roles";
import { CompanyShell } from "@/components/company/CompanyShell";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { authMono, authSans } from "@/lib/fonts/auth-fonts";
import { getCompanyRepository } from "@/lib/db/factory";

export default async function CompanyLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const companyId = session?.user?.companyId;

  if (!companyId && session?.user?.role === ROLES.COMPANY_ADMIN) {
    redirect("/login");
  }

  const company = companyId ? await getCompanyRepository().findById(companyId) : null;
  const companyName = company?.name ?? "Company";
  const companyInitial = companyName.charAt(0).toUpperCase();

  return (
    <RoleGuard allowedRoles={[ROLES.SUPERADMIN, ROLES.COMPANY_ADMIN]}>
      <div
        className={`company-theme min-h-screen font-sans ${authSans.variable} ${authMono.variable}`}
      >
        <CompanyShell
          companyName={companyName}
          companyInitial={companyInitial}
          userName={session?.user?.name}
          userEmail={session?.user?.email}
        >
          {children}
        </CompanyShell>
      </div>
    </RoleGuard>
  );
}
