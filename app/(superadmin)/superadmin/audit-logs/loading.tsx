import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full bg-[#1A1A1E]" />
      <Skeleton className="h-96 w-full bg-[#1A1A1E]" />
    </div>
  );
}
