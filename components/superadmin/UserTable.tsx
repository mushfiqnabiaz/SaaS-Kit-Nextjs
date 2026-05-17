"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Users } from "lucide-react";
import { ROLES, type Role } from "@/config/roles";
import { RoleBadge } from "@/components/superadmin/RoleBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SerializedUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string | null;
  companyName: string | null;
  isActive: boolean;
  createdAt: string;
}

interface UserTableProps {
  rows: SerializedUserRow[];
  total: number;
  page: number;
  limit: number;
  companies: { id: string; name: string }[];
}

export function UserTable({ rows, total, page, limit, companies }: UserTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const role = searchParams.get("role") ?? "";
  const companyId = searchParams.get("companyId") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      startTransition(() => router.push(`/superadmin/users?${params.toString()}`));
    },
    [router, searchParams],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== (searchParams.get("search") ?? "")) {
        updateParams({ search: search || null, page: "1" });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, searchParams, updateParams]);

  async function changeRole(userId: string, newRole: Role) {
    await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    router.refresh();
  }

  async function toggleActive(userId: string, isActive: boolean) {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  async function impersonate(userId: string) {
    const res = await fetch(`/api/admin/users/${userId}/impersonate`, { method: "POST" });
    const json = (await res.json()) as { data?: { redirectUrl?: string } };
    if (json.data?.redirectUrl) window.location.href = json.data.redirectUrl;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Users</h2>
          <span className="rounded border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-2 py-0.5 font-mono text-xs text-[#00D4FF]">
            {total}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs border-[#2A2A30] bg-[#1A1A1E]"
        />
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
          className="h-10 max-w-[200px] rounded-md border border-[#2A2A30] bg-[#1A1A1E] px-3 text-sm"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className={cn("overflow-x-auto rounded border border-[#00D4FF]/20 bg-[#1A1A1E]", pending && "opacity-60")}>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-[#6B7280]">
            <Users className="h-10 w-10 opacity-40" />
            <p className="text-sm">No users match your filters</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2A30] text-left text-[10px] uppercase tracking-wider text-[#6B7280]">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#2A2A30]/50 hover:bg-[#00D4FF]/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded bg-[#00D4FF]/10 font-mono text-xs font-bold text-[#00D4FF]">
                        {row.name.charAt(0)}
                      </span>
                      <span>
                        <span className="font-medium">{row.name}</span>
                        <span className="block font-mono text-[10px] text-[#6B7280]">{row.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={row.role} /></td>
                  <td className="px-4 py-3">
                    {row.companyId ? (
                      <Link href={`/superadmin/companies/${row.companyId}`} className="text-[#00D4FF] hover:underline">
                        {row.companyName ?? "—"}
                      </Link>
                    ) : (
                      <span className="text-[#6B7280]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs", row.isActive ? "text-[#00FF94]" : "text-[#6B7280]")}>
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">
                    {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded p-1 hover:bg-[#2A2A30]">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => void changeRole(row.id, ROLES.COMPANY_ADMIN)}>
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void impersonate(row.id)}>
                          Impersonate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => void toggleActive(row.id, row.isActive)}>
                          {row.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })} className="border-[#2A2A30]">Prev</Button>
          <span className="font-mono text-xs text-[#6B7280]">{page} / {totalPages}</span>
          <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) })} className="border-[#2A2A30]">Next</Button>
        </div>
      ) : null}
    </div>
  );
}
