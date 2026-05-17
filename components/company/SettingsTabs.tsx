"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { PlanCard } from "@/components/company/PlanCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSeatLimit } from "@/lib/plans/seats";
import { cn } from "@/lib/utils";

const tabs = ["general", "security", "billing", "danger"] as const;
type Tab = (typeof tabs)[number];

interface CompanySettings {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: Record<string, unknown>;
}

interface SettingsTabsProps {
  company: CompanySettings;
  seatUsed: number;
}

export function SettingsTabs({ company, seatUsed }: SettingsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) ?? "general";
  const [tab, setTab] = useState<Tab>(tabs.includes(initialTab) ? initialTab : "general");
  const [name, setName] = useState(company.name);
  const [timezone, setTimezone] = useState(String(company.settings.timezone ?? "UTC"));
  const [require2fa, setRequire2fa] = useState(Boolean(company.settings.require2fa));
  const [sessionTimeout, setSessionTimeout] = useState(
    String(company.settings.sessionTimeout ?? "8h"),
  );
  const [allowedDomains, setAllowedDomains] = useState(
    String(company.settings.allowedDomains ?? ""),
  );
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const seatLimit = getSeatLimit(company.plan);

  async function saveGeneral() {
    setSaving(true);
    const res = await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        settings: { ...company.settings, timezone },
      }),
    });
    setSaving(false);
    setMessage(res.ok ? "Saved" : "Failed to save");
    if (res.ok) router.refresh();
  }

  async function saveSecurity() {
    setSaving(true);
    const res = await fetch(`/api/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          ...company.settings,
          timezone,
          require2fa,
          sessionTimeout,
          allowedDomains,
        },
      }),
    });
    setSaving(false);
    setMessage(res.ok ? "Security settings saved" : "Failed to save");
    if (res.ok) router.refresh();
  }

  function copySlug() {
    void navigator.clipboard.writeText(company.slug);
    setMessage("Slug copied");
  }

  async function deleteCompany() {
    if (deleteConfirm !== company.name) return;
    const res = await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
    setMessage(
      res.ok ? "Company deleted" : "Deletion requires platform support — contact admin",
    );
  }

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b border-[#30363D] pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-t-lg px-4 py-2 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "border-b-2 border-[#6366F1] text-[#818CF8]"
                : "text-[#8B949E] hover:text-[#C9D1D9]",
            )}
          >
            {t === "danger" ? "Danger Zone" : t}
          </button>
        ))}
      </nav>

      {message ? <p className="text-sm text-[#818CF8]">{message}</p> : null}

      {tab === "general" ? (
        <section className="max-w-lg space-y-5 rounded-xl border border-[#30363D] bg-[#161B22] p-6">
          <div className="space-y-2">
            <Label className="text-[#C9D1D9]">Company name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="company-input" />
          </div>
          <div className="space-y-2">
            <Label className="text-[#C9D1D9]">Company slug</Label>
            <div className="flex gap-2">
              <Input value={company.slug} disabled className="company-input font-mono opacity-70" />
              <Button type="button" variant="outline" size="icon" onClick={copySlug} className="border-[#30363D]">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#C9D1D9]">Logo</Label>
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-[#30363D] bg-[#0D1117] text-xl font-bold text-[#6366F1]">
                {name.charAt(0)}
              </span>
              <Button type="button" variant="outline" className="border-[#30363D]" disabled>
                Upload logo
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#C9D1D9]">Timezone</Label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="company-input h-10"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern (US)</option>
              <option value="Europe/London">London</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>
          <Button
            type="button"
            onClick={() => void saveGeneral()}
            disabled={saving}
            className="bg-[#6366F1]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </section>
      ) : null}

      {tab === "security" ? (
        <section className="max-w-lg space-y-5 rounded-xl border border-[#30363D] bg-[#161B22] p-6">
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-[#C9D1D9]">Require 2FA for all members</span>
            <input
              type="checkbox"
              checked={require2fa}
              onChange={(e) => setRequire2fa(e.target.checked)}
              className="h-5 w-5 accent-[#6366F1]"
            />
          </label>
          <div className="space-y-2">
            <Label className="text-[#C9D1D9]">Session timeout</Label>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(e.target.value)}
              className="company-input h-10"
            >
              <option value="1h">1 hour</option>
              <option value="8h">8 hours</option>
              <option value="24h">24 hours</option>
              <option value="30d">30 days</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[#C9D1D9]">Allowed email domains</Label>
            <Input
              value={allowedDomains}
              onChange={(e) => setAllowedDomains(e.target.value)}
              placeholder="@acme.com, @acme.io"
              className="company-input"
            />
            <p className="text-[11px] text-[#6E7681]">Comma-separated. Leave empty to allow any domain.</p>
          </div>
          <Button type="button" onClick={() => void saveSecurity()} disabled={saving} className="bg-[#6366F1]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save security settings"}
          </Button>
        </section>
      ) : null}

      {tab === "billing" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <PlanCard
            plan={company.plan}
            seatUsed={seatUsed}
            seatLimit={seatLimit}
            renewalDate="Apr 1, 2026"
          />
          <section className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
            <h3 className="text-sm font-semibold text-[#E6EDF3]">Invoice history</h3>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-[#30363D] text-left text-[10px] uppercase text-[#6E7681]">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {[
                  { date: "Mar 1, 2026", amount: "$49.00", status: "Paid" },
                  { date: "Feb 1, 2026", amount: "$49.00", status: "Paid" },
                  { date: "Jan 1, 2026", amount: "$49.00", status: "Paid" },
                ].map((row) => (
                  <tr key={row.date} className="border-b border-[#30363D]/50">
                    <td className="py-2.5 text-[#8B949E]">{row.date}</td>
                    <td className="py-2.5 company-tabular">{row.amount}</td>
                    <td className="py-2.5 text-[#2DD4BF]">{row.status}</td>
                    <td className="py-2.5 text-right">
                      <button type="button" className="text-xs text-[#6366F1] hover:underline">
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      ) : null}

      {tab === "danger" ? (
        <section className="max-w-lg rounded-xl border border-[#F87171]/40 bg-[#F87171]/5 p-6">
          <h3 className="font-semibold text-[#F87171]">Delete company</h3>
          <p className="mt-2 text-sm text-[#8B949E]">
            This will permanently delete all users and data. This action cannot be undone.
          </p>
          <div className="mt-4 space-y-2">
            <Label className="text-[#C9D1D9]">
              Type <strong>{company.name}</strong> to confirm
            </Label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="company-input"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-[#F87171] text-[#F87171] hover:bg-[#F87171]/10"
            disabled={deleteConfirm !== company.name}
            onClick={() => void deleteCompany()}
          >
            Delete company
          </Button>
        </section>
      ) : null}
    </div>
  );
}
