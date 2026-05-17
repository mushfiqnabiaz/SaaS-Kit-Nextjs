"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { format } from "date-fns";
import { Copy, Download, ScrollText } from "lucide-react";
import { ROLES, type Role } from "@/config/roles";
import { RoleBadge } from "@/components/superadmin/RoleBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SerializedAuditRow {
  id: string;
  createdAt: string;
  actorName: string;
  actorEmail: string;
  actorRole: Role;
  action: string;
  resource: string;
  resourceId: string | null;
  companyName: string | null;
  ip: string | null;
}

interface AuditTableProps {
  rows: SerializedAuditRow[];
  total: number;
  page: number;
  limit: number;
  companies: { id: string; name: string }[];
}

const actionStyles: Record<string, string> = {
  LOGIN: "border-[#00D4FF]/40 bg-[#00D4FF]/10 text-[#00D4FF]",
  CREATED: "border-[#00FF94]/40 bg-[#00FF94]/10 text-[#00FF94]",
  UPDATED: "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]",
  DELETED: "border-[#FF4D6A]/40 bg-[#FF4D6A]/10 text-[#FF4D6A]",
  IMPERSONATION: "border-[#A855F7]/40 bg-[#A855F7]/10 text-[#C084FC]",
};

function actionBadgeClass(action: string): string {
  if (action.includes("LOGIN")) return actionStyles.LOGIN;
  if (action.includes("CREATED")) return actionStyles.CREATED;
  if (action.includes("UPDATED") || action.includes("CHANGED")) return actionStyles.UPDATED;
  if (action.includes("DELETED")) return actionStyles.DELETED;
  if (action.includes("IMPERSONATION")) return actionStyles.IMPERSONATION;
  return "border-[#6B7280]/40 bg-[#6B7280]/10 text-[#9CA3AF]";
}

function copyId(id: string) {
  void navigator.clipboard.writeText(id);
}

export function AuditTable({ rows, total, page, limit, companies }: AuditTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const action = searchParams.get("action") ?? "";
  const role = searchParams.get("role") ?? "";
  const companyId = searchParams.get("companyId") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      startTransition(() => router.push(`/superadmin/audit-logs?${params.toString()}`));
    },
    [router, searchParams],
  );

  function exportCsv() {
    const header = ["Timestamp", "Actor", "Email", "Role", "Action", "Resource", "Resource ID", "Company", "IP"];
    const lines = rows.map((r) =>
      [
        r.createdAt,
        r.actorName,
        r.actorEmail,
        r.actorRole,
        r.action,
        r.resource,
        r.resourceId ?? "",
        r.companyName ?? "",
        r.ip ?? "",
      ].join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => updateParams({ from: e.target.value || null, page: "1" })}
            className="h-10 rounded-md border border-[#2A2A30] bg-[#1A1A1E] px-3 text-sm"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => updateParams({ to: e.target.value || null, page: "1" })}
            className="h-10 rounded-md border border-[#2A2A30] bg-[#1A1A1E] px-3 text-sm"
          />
          <select
            value={action}
            onChange={(e) => updateParams({ action: e.target.value || null, page: "1" })}
            className="h-10 rounded-md border border-[#2A2A30] bg-[#1A1A1E] px-3 text-sm"
          >
            <option value="">All Actions</option>
            <option value="LOGIN_SUCCESS">Login</option>
            <option value="USER_CREATED">Create</option>
            <option value="USER_UPDATED">Update</option>
            <option value="USER_DELETED">Delete</option>
            <option value="IMPERSONATION_START">Impersonate</option>
          </select>
          <select
            value={role}
            onChange={(e) => updateParams({ role: e.target.value || null, page: "1" })}
            className="h-10 rounded-md border border-[#2A2A30] bg-[#1A1A1E] px-3 text-sm"
          >
            <option value="">All Roles</option>
            <option value={ROLES.SUPERADMIN}>Superadmin</option>
            <option value={ROLES.COMPANY_ADMIN}>Company Admin</option>
            <option value={ROLES.USER}>User</option>
          </select>
          <select
            value={companyId}
            onChange={(e) => updateParams({ companyId: e.target.value || null, page: "1" })}
            className="h-10 max-w-[180px] rounded-md border border-[#2A2A30] bg-[#1A1A1E] px-3 text-sm"
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={exportCsv}
          className="border-[#00D4FF]/30 text-[#00D4FF]"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div
        className={cn(
          "overflow-x-auto rounded border border-[#00D4FF]/20 bg-[#1A1A1E]",
          pending && "opacity-60",
        )}
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-[#6B7280]">
            <ScrollText className="h-10 w-10 opacity-40" />
            <p className="text-sm">No audit logs match your filters</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2A30] text-left text-[10px] uppercase tracking-wider text-[#6B7280]">
                <th className="px-3 py-3 font-medium">Timestamp</th>
                <th className="px-3 py-3 font-medium">Actor</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Action</th>
                <th className="px-3 py-3 font-medium">Resource</th>
                <th className="px-3 py-3 font-medium">Resource ID</th>
                <th className="px-3 py-3 font-medium">Company</th>
                <th className="px-3 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#2A2A30]/50">
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-[#9CA3AF]">
                    {format(new Date(row.createdAt), "yyyy-MM-dd HH:mm:ss")}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="block text-sm">{row.actorName}</span>
                    <span className="font-mono text-[10px] text-[#6B7280]">{row.actorEmail}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <RoleBadge role={row.actorRole} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-block rounded border px-1.5 py-0.5 font-mono text-[10px]",
                        actionBadgeClass(row.action),
                      )}
                    >
                      {row.action}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[#9CA3AF]">{row.resource}</td>
                  <td className="px-3 py-2.5">
                    {row.resourceId ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                        {row.resourceId.slice(0, 8)}…
                        <button
                          type="button"
                          onClick={() => copyId(row.resourceId!)}
                          className="text-[#6B7280] hover:text-[#00D4FF]"
                          aria-label="Copy ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[#9CA3AF]">{row.companyName ?? "—"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-[#6B7280]">{row.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
            className="border-[#2A2A30]"
          >
            Prev
          </Button>
          <span className="font-mono text-xs text-[#6B7280]">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: String(page + 1) })}
            className="border-[#2A2A30]"
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
