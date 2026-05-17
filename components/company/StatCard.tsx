import Link from "next/link";
import type { CompanyKpi } from "@/lib/data/company";

export function StatCard({ data }: { data: CompanyKpi }) {
  return (
    <article className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-[#6E7681]">{data.label}</p>
      <p className="company-tabular mt-3 text-3xl font-semibold text-[#E6EDF3]">
        {typeof data.value === "number" ? data.value.toLocaleString() : data.value}
      </p>
      {data.hint && data.href ? (
        <Link href={data.href} className="mt-2 inline-block text-xs font-medium text-[#6366F1] hover:underline">
          {data.hint}
        </Link>
      ) : null}
    </article>
  );
}
