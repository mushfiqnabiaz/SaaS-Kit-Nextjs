import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Users } from "lucide-react";
import { MemberRoleLabel } from "@/components/company/MemberRoleLabel";
import { Button } from "@/components/ui/button";
import type { TeamMemberRow } from "@/lib/data/company";
import { cn } from "@/lib/utils";

export function RecentMembersTable({ rows }: { rows: TeamMemberRow[] }) {
  return (
    <section className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-[#E6EDF3]">Recent Members</h2>
        <Button asChild size="sm" variant="outline" className="border-[#30363D] text-[#818CF8]">
          <Link href="/company/users/invite">Invite</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 text-[#6E7681]">
          <Users className="h-8 w-8 opacity-40" />
          <p className="text-sm">No team members yet</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#30363D] text-left text-[10px] uppercase tracking-wider text-[#6E7681]">
                <th className="pb-3 pr-4 font-medium">Member</th>
                <th className="pb-3 pr-4 font-medium">Role</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Joined</th>
                <th className="pb-3 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#30363D]/50">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6366F1]/15 text-xs font-semibold text-[#818CF8]">
                        {row.name.charAt(0)}
                      </span>
                      <span>
                        <span className="font-medium text-[#E6EDF3]">{row.name}</span>
                        <span className="block text-[11px] text-[#6E7681]">{row.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <MemberRoleLabel role={row.role} companyRoleName={row.companyRoleName} />
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-[#6E7681]">
                    {formatDistanceToNow(row.createdAt, { addSuffix: true })}
                  </td>
                  <td className="py-3 text-[11px] text-[#6E7681]">
                    {row.lastActiveAt
                      ? formatDistanceToNow(row.lastActiveAt, { addSuffix: true })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link
        href="/company/users"
        className="mt-4 inline-block text-xs font-medium text-[#6366F1] hover:underline"
      >
        View all →
      </Link>
    </section>
  );
}

function StatusBadge({ status }: { status: TeamMemberRow["status"] }) {
  const styles = {
    active: "text-[#2DD4BF]",
    inactive: "text-[#6E7681]",
    pending: "text-[#FBBF24]",
  };
  const labels = { active: "Active", inactive: "Inactive", pending: "Pending" };
  return (
    <span className={cn("text-xs font-medium capitalize", styles[status])}>{labels[status]}</span>
  );
}
