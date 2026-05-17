import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { KpiCardData } from "@/lib/data/superadmin";
import { Sparkline } from "@/components/superadmin/Sparkline";
import { cn } from "@/lib/utils";

export function StatCard({ data }: { data: KpiCardData }) {
  const TrendIcon =
    data.trendDirection === "up"
      ? ArrowUpRight
      : data.trendDirection === "down"
        ? ArrowDownRight
        : ArrowRight;

  const trendColor =
    data.trendDirection === "up"
      ? "text-[#00FF94]"
      : data.trendDirection === "down"
        ? "text-[#FF4D6A]"
        : "text-[#6B7280]";

  return (
    <article className="rounded border border-[#00D4FF]/20 bg-[#1A1A1E] p-4">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[#6B7280]">
        {data.label}
      </p>
      <p className="admin-tabular mt-2 font-mono text-4xl font-semibold text-[#00D4FF]">
        {data.value.toLocaleString()}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          {data.trendPercent}% vs last month
        </span>
      </div>
      <div className="mt-3 h-10 opacity-80">
        <Sparkline data={data.sparkline} />
      </div>
    </article>
  );
}
