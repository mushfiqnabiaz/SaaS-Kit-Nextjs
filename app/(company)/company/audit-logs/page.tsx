import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuditLogsTable } from "@/components/audit/AuditLogsTable";

export default async function CompanyAuditLogsPage() {
  const session = await auth();
  const companyId = session?.user?.companyId;

  if (!companyId) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#8B949E]">Activity within your company workspace</p>
      <AuditLogsTable showCompanyFilter={false} scopeCompanyId={companyId} />
    </div>
  );
}
