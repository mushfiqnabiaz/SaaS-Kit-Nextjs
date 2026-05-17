import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 bg-[#1A1A1E]" />
        <Skeleton className="h-48 bg-[#1A1A1E]" />
      </div>
      <Skeleton className="h-64 bg-[#1A1A1E]" />
      <Skeleton className="h-56 bg-[#1A1A1E]" />
    </div>
  );
}
