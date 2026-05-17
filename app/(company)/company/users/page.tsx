import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLES, type Role } from "@/config/roles";
import { TeamTable } from "@/components/company/TeamTable";
import { Skeleton } from "@/components/ui/skeleton";
import { getTeamTableData } from "@/lib/data/company";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
    status?: string;
  }>;
}

export default async function CompanyUsersPage({ searchParams }: PageProps) {
  const session = await auth();
  const companyId = session?.user?.companyId;

  if (!companyId) {
    redirect("/login");
  }

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 20;
  const role =
    sp.role && (sp.role === ROLES.USER || sp.role === ROLES.COMPANY_ADMIN)
      ? (sp.role as Role)
      : undefined;
  const status =
    sp.status === "active" || sp.status === "inactive" || sp.status === "pending"
      ? sp.status
      : sp.status === "all"
        ? "all"
        : undefined;

  const { rows, total } = await getTeamTableData(companyId, {
    page,
    limit,
    search: sp.search,
    role,
    status: status ?? "all",
  });

  const serialized = rows.map((r) => ({
    ...r,
    lastActiveAt: r.lastActiveAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <Suspense fallback={<TableSkeleton />}>
      <TeamTable rows={serialized} total={total} page={page} limit={limit} />
    </Suspense>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48 bg-[#161B22]" />
      <Skeleton className="h-96 w-full bg-[#161B22]" />
    </div>
  );
}
