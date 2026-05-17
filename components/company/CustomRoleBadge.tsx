import { cn } from "@/lib/utils";

export function CustomRoleBadge({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-[#6366F1]/30 bg-[#6366F1]/10 px-2 py-0.5 text-[11px] font-medium text-[#A5B4FC]",
        className,
      )}
    >
      {name}
    </span>
  );
}
