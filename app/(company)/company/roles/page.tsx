import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RolesPageClient } from "@/components/company/RolesPageClient";
import { getCompanyRolesData } from "@/lib/data/company";

export default async function CompanyRolesPage() {
  const session = await auth();
  const companyId = session?.user?.companyId;

  if (!companyId) {
    redirect("/login");
  }

  const roles = await getCompanyRolesData(companyId);

  return (
    <div className="mx-auto max-w-4xl space-y-2">
      <RolesPageClient initialRoles={roles} />
    </div>
  );
}
