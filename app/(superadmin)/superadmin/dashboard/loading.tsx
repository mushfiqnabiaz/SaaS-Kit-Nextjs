import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 bg-[#1A1A1E]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Skeleton className="h-72 lg:col-span-3 bg-[#1A1A1E]" />
        <Skeleton className="h-72 lg:col-span-2 bg-[#1A1A1E]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 bg-[#1A1A1E]" />
        <Skeleton className="h-64 bg-[#1A1A1E]" />
      </div>
    </div>
  );
}
