"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Building2, MoreHorizontal, Plus } from "lucide-react";
import { PlanBadge } from "@/components/superadmin/PlanBadge";
import { CompanySheet } from "@/components/superadmin/CompanySheet";
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

export interface SerializedCompanyRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  ownerName: string;
  ownerEmail: string;
  userCount: number;
  isActive: boolean;
  createdAt: string;
}

interface CompanyTableProps {
  rows: SerializedCompanyRow[];
  total: number;
  page: number;
  limit: number;
}

export function CompanyTable({ rows, total, page, limit }: CompanyTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const plan = searchParams.get("plan") ?? "";
  const status = searchParams.get("status") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      startTransition(() => router.push(`/superadmin/companies?${params.toString()}`));
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

  async function toggleStatus(id: string, isActive: boolean) {
    await fetch(`/api/admin/companies/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Companies</h2>
          <span className="rounded border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-2 py-0.5 font-mono text-xs text-[#00D4FF]">
            {total}
          </span>
        </div>
        <Button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="bg-[#00D4FF] text-[#0F0F10] hover:bg-[#00D4FF]/90"
        >
          <Plus className="h-4 w-4" />
          New Company
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs border-[#2A2A30] bg-[#1A1A1E]"
        />
        <select
          value={plan}
          onChange={(e) => updateParams({ plan: e.target.value || null, page: "1" })}
          className="h-10 rounded-md border border-[#2A2A30] bg-[#1A1A1E] px-3 text-sm"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value || null, page: "1" })}
          className="h-10 rounded-md border border-[#2A2A30] bg-[#1A1A1E] px-3 text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className={cn("overflow-x-auto rounded border border-[#00D4FF]/20 bg-[#1A1A1E]", pending && "opacity-60")}>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-[#6B7280]">
            <Building2 className="h-10 w-10 opacity-40" />
            <p className="text-sm">No companies match your filters</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2A30] text-left text-[10px] uppercase tracking-wider text-[#6B7280]">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 text-right font-medium">Users</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#2A2A30]/50 hover:bg-[#00D4FF]/5">
                  <td className="px-4 py-3">
                    <Link href={`/superadmin/companies/${row.id}`} className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded bg-[#00D4FF]/10 font-mono text-xs font-bold text-[#00D4FF]">
                        {row.name.charAt(0)}
                      </span>
                      <span>
                        <span className="font-medium">{row.name}</span>
                        <span className="block font-mono text-[10px] text-[#6B7280]">{row.slug}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><PlanBadge plan={row.plan} /></td>
                  <td className="px-4 py-3">
                    <span className="block text-sm">{row.ownerName}</span>
                    <span className="font-mono text-[10px] text-[#6B7280]">{row.ownerEmail}</span>
                  </td>
                  <td className="admin-tabular px-4 py-3 text-right font-mono">{row.userCount}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1.5 text-xs", row.isActive ? "text-[#00FF94]" : "text-[#6B7280]")}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", row.isActive ? "bg-[#00FF94]" : "bg-[#6B7280]")} />
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#6B7280]" title={row.createdAt}>
                    {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded p-1 hover:bg-[#2A2A30]">
                        <MoreHorizontal className="h-4 w-4 text-[#9CA3AF]" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/superadmin/companies/${row.id}`}>View</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/superadmin/companies/${row.id}?tab=settings`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void toggleStatus(row.id, row.isActive)}>
                          {row.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-[#FF4D6A]"
                          onClick={() => void toggleStatus(row.id, true)}
                        >
                          Delete
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

      <CompanySheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
