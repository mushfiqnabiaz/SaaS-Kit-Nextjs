import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      <Skeleton className="h-40 rounded-2xl bg-[#111827]" />
      <div className="grid gap-5 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl bg-[#111827]" />
        <Skeleton className="h-28 rounded-2xl bg-[#111827]" />
        <Skeleton className="h-28 rounded-2xl bg-[#111827]" />
      </div>
      <Skeleton className="h-64 rounded-2xl bg-[#111827]" />
    </div>
  );
}
