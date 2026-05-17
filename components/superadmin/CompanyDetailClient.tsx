"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/config/roles";
import { AuditLogsTable } from "@/components/audit/AuditLogsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CompanyDetail {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  userCount: number;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

type Tab = "users" | "audit" | "settings";

export function CompanyDetailClient({ companyId }: { companyId: string }) {
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tab, setTab] = useState<Tab>("users");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("free");

  const load = useCallback(async () => {
    setLoading(true);
    const [companyRes, usersRes] = await Promise.all([
      fetch(`/api/admin/companies/${companyId}`),
      fetch(`/api/admin/users?companyId=${companyId}&limit=100`),
    ]);
    const companyJson = (await companyRes.json()) as { data: CompanyDetail | null };
    const usersJson = (await usersRes.json()) as { data: UserRow[] | null };
    const c = companyJson.data;
    setCompany(c);
    if (c) {
      setName(c.name);
      setPlan(c.plan);
    }
    setUsers(usersJson.data ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSettings() {
    await fetch(`/api/admin/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, plan }),
    });
    void load();
  }

  async function deactivateCompany() {
    if (!confirm("Deactivate this company?")) return;
    await fetch(`/api/admin/companies/${companyId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    void load();
  }

  if (loading || !company) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="p-8">
      <Link href="/superadmin/companies" className="text-sm text-primary hover:underline">
        ← Back to companies
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{company.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {company.slug} · {company.plan} plan · Owner: {company.ownerName} ({company.ownerEmail})
      </p>
      <p className="text-sm text-muted-foreground">
        Created {new Date(company.createdAt).toLocaleDateString()} · {company.userCount} users
      </p>

      <div className="mt-6 flex gap-2 border-b border-border">
        {(["users", "audit", "settings"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium capitalize",
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            {t === "audit" ? "Audit logs" : t}
          </button>
        ))}
      </div>

      {tab === "users" ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[user.role]}</td>
                  <td className="px-4 py-3">{user.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "audit" ? (
        <div className="mt-6">
          <AuditLogsTable showCompanyFilter={false} scopeCompanyId={companyId} />
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="mt-6 max-w-md space-y-6">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="company-name">Company name</Label>
              <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="company-plan">Plan</Label>
              <select
                id="company-plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <Button type="button" onClick={() => void saveSettings()}>
              Save changes
            </Button>
          </div>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <h3 className="font-semibold text-destructive">Danger zone</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Deactivating a company blocks all tenant users from accessing the workspace.
            </p>
            <Button
              type="button"
              variant="destructive"
              className="mt-3"
              onClick={() => void deactivateCompany()}
            >
              Deactivate company
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
