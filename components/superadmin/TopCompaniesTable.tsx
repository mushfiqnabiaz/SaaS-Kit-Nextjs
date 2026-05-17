import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Building2 } from "lucide-react";
import type { TopCompanyRow } from "@/lib/data/superadmin";
import { PlanBadge } from "@/components/superadmin/PlanBadge";
import { cn } from "@/lib/utils";

export function TopCompaniesTable({ rows }: { rows: TopCompanyRow[] }) {
  return (
    <section className="rounded border border-[#00D4FF]/20 bg-[#1A1A1E] p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9CA3AF]">
        Top Companies
      </h2>
      {rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 text-[#6B7280]">
          <Building2 className="h-8 w-8 opacity-50" />
          <p className="text-sm">No companies yet</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2A30] text-left text-[10px] uppercase tracking-wider text-[#6B7280]">
                <th className="pb-2 pr-4 font-medium">Company</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 text-right font-medium">Users</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#2A2A30]/60 transition-colors hover:bg-[#00D4FF]/5"
                >
                  <td className="py-3 pr-4">
                    <Link
                      href={`/superadmin/companies/${row.id}`}
                      className="flex items-center gap-2 hover:text-[#00D4FF]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded bg-[#00D4FF]/10 font-mono text-xs font-bold text-[#00D4FF]">
                        {row.name.charAt(0)}
                      </span>
                      <span>
                        <span className="font-medium">{row.name}</span>
                        <span className="block font-mono text-[10px] text-[#6B7280]">
                          {row.slug}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <PlanBadge plan={row.plan} />
                  </td>
                  <td className="admin-tabular py-3 pr-4 text-right font-mono">
                    {row.userCount}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-xs",
                        row.isActive ? "text-[#00FF94]" : "text-[#6B7280]",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          row.isActive ? "bg-[#00FF94]" : "bg-[#6B7280]",
                        )}
                      />
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td
                    className="py-3 font-mono text-xs text-[#6B7280]"
                    title={row.createdAt.toISOString()}
                  >
                    {formatDistanceToNow(row.createdAt, { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link
        href="/superadmin/companies"
        className="mt-4 inline-block text-xs font-medium text-[#00D4FF] hover:underline"
      >
        View all companies →
      </Link>
    </section>
  );
}
