import { Suspense } from "react";
import { AuditTable } from "@/components/superadmin/AuditTable";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLES, type Role } from "@/config/roles";
import { getAuditTableData, getCompanyOptions } from "@/lib/data/superadmin";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    action?: string;
    role?: string;
    companyId?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function SuperadminAuditLogsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 20;
  const role =
    sp.role && Object.values(ROLES).includes(sp.role as Role) ? (sp.role as Role) : undefined;

  const [data, companies] = await Promise.all([
    getAuditTableData({
      page,
      limit,
      action: sp.action,
      actorRole: role,
      companyId: sp.companyId,
      from: sp.from ? new Date(sp.from) : undefined,
      to: sp.to ? new Date(sp.to) : undefined,
    }),
    getCompanyOptions(),
  ]);

  const serialized = data.rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <Suspense fallback={<TableSkeleton />}>
      <AuditTable
        rows={serialized}
        total={data.total}
        page={page}
        limit={limit}
        companies={companies}
      />
    </Suspense>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48 bg-[#1A1A1E]" />
      <Skeleton className="h-64 w-full bg-[#1A1A1E]" />
    </div>
  );
}
