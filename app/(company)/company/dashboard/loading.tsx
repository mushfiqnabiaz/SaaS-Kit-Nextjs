import { Skeleton } from "@/components/ui/skeleton";

export default function CompanyDashboardLoading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-28 w-full rounded-xl bg-[#161B22]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl bg-[#161B22]" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl bg-[#161B22]" />
    </div>
  );
}
