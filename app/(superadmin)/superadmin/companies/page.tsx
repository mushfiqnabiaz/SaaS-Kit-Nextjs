import { Suspense } from "react";
import { CompanyTable } from "@/components/superadmin/CompanyTable";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompaniesTableData } from "@/lib/data/superadmin";
interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    plan?: string;
    status?: string;
  }>;
}

export default async function SuperadminCompaniesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 20;
  const isActive =
    sp.status === "active" ? true : sp.status === "inactive" ? false : undefined;

  const { rows, total } = await getCompaniesTableData({
    page,
    limit,
    search: sp.search,
    plan: sp.plan,
    isActive,
  });

  const serialized = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <Suspense fallback={<TableSkeleton />}>
      <CompanyTable rows={serialized} total={total} page={page} limit={limit} />
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
