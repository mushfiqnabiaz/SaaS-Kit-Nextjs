import { Suspense } from "react";
import { UserTable } from "@/components/superadmin/UserTable";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLES, type Role } from "@/config/roles";
import { getCompanyOptions, getUsersTableData } from "@/lib/data/superadmin";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
    companyId?: string;
  }>;
}

export default async function SuperadminUsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 20;
  const role =
    sp.role && Object.values(ROLES).includes(sp.role as Role) ? (sp.role as Role) : undefined;

  const [data, companies] = await Promise.all([
    getUsersTableData({
      page,
      limit,
      search: sp.search,
      role,
      companyId: sp.companyId,
    }),
    getCompanyOptions(),
  ]);

  const serialized = data.rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <Suspense fallback={<TableSkeleton />}>
      <UserTable
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
