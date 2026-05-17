"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";
import { ROLE_LABELS, ROLES, type Role } from "@/config/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AuditLogRow {
  id: string;
  createdAt: string;
  actorName: string;
  actorRole: Role;
  action: string;
  resource: string;
  companyName: string | null;
  ip: string | null;
}

interface AuditLogsTableProps {
  showCompanyFilter?: boolean;
  scopeCompanyId?: string;
}

export function AuditLogsTable({
  showCompanyFilter = true,
  scopeCompanyId,
}: AuditLogsTableProps) {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [role, setRole] = useState("");
  const [action, setAction] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (role) params.set("role", role);
    if (action) params.set("action", action);
    if (scopeCompanyId) {
      params.set("companyId", scopeCompanyId);
    } else if (companyId && showCompanyFilter) {
      params.set("companyId", companyId);
    }
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());

    const res = await fetch(`/api/audit-logs?${params}`);
    const json = (await res.json()) as {
      data: AuditLogRow[] | null;
      meta?: { totalPages?: number };
    };

    setLogs(json.data ?? []);
    setTotalPages(json.meta?.totalPages ?? 1);
    setLoading(false);
  }, [page, role, action, companyId, from, to, showCompanyFilter, scopeCompanyId]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  function exportCsv() {
    const header = ["Timestamp", "Actor", "Role", "Action", "Resource", "Company", "IP"];
    const rows = logs.map((log) => [
      new Date(log.createdAt).toISOString(),
      log.actorName,
      log.actorRole,
      log.action,
      log.resource,
      log.companyName ?? "",
      log.ip ?? "",
    ]);
    const csv = [header, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="flex h-10 w-40 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All roles</option>
            {Object.values(ROLES).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="action">Action</Label>
          <select
            id="action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="flex h-10 w-48 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All actions</option>
            {Object.values(AUDIT_ACTIONS).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        {showCompanyFilter ? (
          <div className="space-y-1">
            <Label htmlFor="companyId">Company ID</Label>
            <Input
              id="companyId"
              placeholder="Optional"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            />
          </div>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setPage(1);
            void fetchLogs();
          }}
        >
          Apply filters
        </Button>
        <Button type="button" variant="outline" onClick={exportCsv} disabled={logs.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Resource</th>
                {showCompanyFilter ? (
                  <th className="px-4 py-3 font-medium">Company</th>
                ) : null}
                <th className="px-4 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={showCompanyFilter ? 7 : 6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-4 py-3">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{log.actorName}</td>
                    <td className="px-4 py-3">{ROLE_LABELS[log.actorRole]}</td>
                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3">{log.resource}</td>
                    {showCompanyFilter ? (
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.companyName ?? "—"}
                      </td>
                    ) : null}
                    <td className="px-4 py-3 text-muted-foreground">{log.ip ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
