import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  free: "border-[#6B7280]/40 bg-[#6B7280]/10 text-[#9CA3AF]",
  pro: "border-[#A855F7]/40 bg-[#A855F7]/10 text-[#C084FC]",
  enterprise: "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#FBBF24]",
};

export function PlanBadge({ plan, className }: { plan: string; className?: string }) {
  const key = plan.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        styles[key] ?? styles.free,
        className,
      )}
    >
      {plan}
    </span>
  );
}
