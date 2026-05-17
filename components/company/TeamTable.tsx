"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, UserPlus, Users } from "lucide-react";
import { ROLES, type Role } from "@/config/roles";
import { MemberRoleLabel } from "@/components/company/MemberRoleLabel";
import { RolePopover } from "@/components/company/RolePopover";
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

export interface SerializedTeamMemberRow {
  id: string;
  kind: "user" | "invite";
  name: string;
  email: string;
  role: Role;
  companyRoleId: string | null;
  companyRoleName: string | null;
  status: "active" | "inactive" | "pending";
  lastActiveAt: string | null;
  createdAt: string;
}

interface TeamTableProps {
  rows: SerializedTeamMemberRow[];
  total: number;
  page: number;
  limit: number;
}

export function TeamTable({ rows, total, page, limit }: TeamTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const roleFilter = searchParams.get("role") ?? "";
  const statusFilter = searchParams.get("status") ?? "all";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      startTransition(() => router.push(`/company/users?${params.toString()}`));
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

  async function deactivateUser(id: string, isActive: boolean) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  async function removeUser(id: string) {
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function resendInvite(id: string) {
    await fetch(`/api/users/invite/${id}/resend`, { method: "POST" });
    router.refresh();
  }

  async function revokeInvite(id: string) {
    await fetch(`/api/users/invite/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-[#E6EDF3]">Team</h2>
          <span className="rounded-md bg-[#6366F1]/15 px-2 py-0.5 text-xs font-medium text-[#818CF8]">
            {total}
          </span>
        </div>
        <Button asChild className="bg-[#6366F1] hover:bg-[#6366F1]/90">
          <Link href="/company/users/invite">
            <UserPlus className="h-4 w-4" />
            Invite member
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs border-[#30363D] bg-[#161B22]"
        />
        <select
          value={roleFilter}
          onChange={(e) => updateParams({ role: e.target.value || null, page: "1" })}
          className="company-input h-10 w-auto"
        >
          <option value="">All Roles</option>
          <option value={ROLES.COMPANY_ADMIN}>Admin</option>
          <option value={ROLES.USER}>User</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => updateParams({ status: e.target.value, page: "1" })}
          className="company-input h-10 w-auto"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div
        className={cn(
          "overflow-x-auto rounded-xl border border-[#30363D] bg-[#161B22]",
          pending && "opacity-60",
        )}
      >
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-[#6E7681]">
            <Users className="h-10 w-10 opacity-40" />
            <p className="text-sm">No team members match your filters</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#30363D] text-left text-[10px] uppercase tracking-wider text-[#6E7681]">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Active</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className="border-b border-[#30363D]/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6366F1]/15 text-xs font-semibold text-[#818CF8]">
                        {row.name.charAt(0)}
                      </span>
                      <span>
                        <span className="font-medium text-[#E6EDF3]">{row.name}</span>
                        <span className="block text-[11px] text-[#6E7681]">{row.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {row.kind === "user" && row.status !== "pending" ? (
                      <RolePopover
                        userId={row.id}
                        currentRole={row.role}
                        currentCompanyRoleId={row.companyRoleId}
                        currentCompanyRoleName={row.companyRoleName}
                        memberName={row.name}
                        onChanged={() => router.refresh()}
                      />
                    ) : (
                      <MemberRoleLabel
                        role={row.role}
                        companyRoleName={row.companyRoleName}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[#6E7681]">
                    {row.lastActiveAt
                      ? formatDistanceToNow(new Date(row.lastActiveAt), { addSuffix: true })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[#6E7681]">
                    {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded p-1 hover:bg-[#21262D]">
                        <MoreHorizontal className="h-4 w-4 text-[#8B949E]" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {row.kind === "invite" ? (
                          <>
                            <DropdownMenuItem onClick={() => void resendInvite(row.id)}>
                              Resend invite
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-[#F87171]"
                              onClick={() => void revokeInvite(row.id)}
                            >
                              Revoke
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem
                              onClick={() => void deactivateUser(row.id, row.status === "active")}
                            >
                              {row.status === "active" ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-[#F87171]"
                              onClick={() => void removeUser(row.id)}
                            >
                              Remove
                            </DropdownMenuItem>
                          </>
                        )}
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
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
            className="border-[#30363D]"
          >
            Prev
          </Button>
          <span className="self-center text-xs text-[#6E7681]">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: String(page + 1) })}
            className="border-[#30363D]"
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: SerializedTeamMemberRow["status"] }) {
  const map = {
    active: "text-[#2DD4BF]",
    inactive: "text-[#6E7681]",
    pending: "text-[#FBBF24]",
  };
  return <span className={cn("text-xs font-medium capitalize", map[status])}>{status}</span>;
}
