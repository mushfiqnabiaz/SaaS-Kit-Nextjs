"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  Database,
  Flag,
  Globe,
  ImageIcon,
  KeyRound,
  Loader2,
  Palette,
  X,
} from "lucide-react";
import { PlanBadge } from "@/components/superadmin/PlanBadge";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAppInitial } from "@/lib/app-config";
import type { PlatformFeatureFlags } from "@/lib/db/interfaces";
import { cn } from "@/lib/utils";

const PLAN_ORDER = ["free", "pro", "enterprise"] as const;

const FLAG_LABELS: Record<string, string> = {
  invites: "Invites",
  auditLogs: "Audit Logs",
  apiAccess: "API Access",
};

interface SettingsPageClientProps {
  appName: string;
  logoUrl: string | null;
  initialFeatureFlags: PlatformFeatureFlags;
  updatedAt: string;
  userEmail?: string | null;
  dbDriver: string;
  nodeEnv: string;
}

type Toast = { type: "success" | "error"; text: string } | null;

export function SettingsPageClient({
  appName,
  logoUrl,
  initialFeatureFlags,
  updatedAt,
  userEmail,
  dbDriver,
  nodeEnv,
}: SettingsPageClientProps) {
  const [featureFlags, setFeatureFlags] = useState(initialFeatureFlags);
  const [flagsDirty, setFlagsDirty] = useState(false);
  const [savingFlags, setSavingFlags] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    password: "",
  });

  const flagKeys = Array.from(
    new Set(
      PLAN_ORDER.flatMap((plan) => Object.keys(featureFlags[plan] ?? {})),
    ),
  );

  function showToast(type: "success" | "error", text: string) {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }

  function toggleFlag(plan: string, flag: string, enabled: boolean) {
    setFeatureFlags((prev) => ({
      ...prev,
      [plan]: { ...prev[plan], [flag]: enabled },
    }));
    setFlagsDirty(true);
  }

  async function saveFlags() {
    setSavingFlags(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureFlags }),
    });
    setSavingFlags(false);
    if (res.ok) {
      setFlagsDirty(false);
      showToast("success", "Feature flags saved");
    } else {
      showToast("error", "Failed to save feature flags");
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwordForm),
    });
    const json = (await res.json()) as { error?: string };
    setSavingPassword(false);
    if (res.ok) {
      setPasswordForm({ currentPassword: "", password: "" });
      showToast("success", "Password updated");
    } else {
      showToast(
        "error",
        typeof json.error === "string" ? json.error : "Failed to update password",
      );
    }
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded border px-4 py-2.5 text-sm",
            toast.type === "success"
              ? "border-[#00FF94]/30 bg-[#00FF94]/10 text-[#00FF94]"
              : "border-[#FF4D6A]/30 bg-[#FF4D6A]/10 text-[#FF4D6A]",
          )}
        >
          {toast.type === "success" ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : (
            <X className="h-4 w-4 shrink-0" />
          )}
          {toast.text}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <SettingsCard
          icon={Palette}
          title="Platform Branding"
          description="Read-only — configured via environment variables"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-[#00D4FF]/30 bg-[#00D4FF]/10 font-mono text-xl font-bold text-[#00D4FF]">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full rounded object-cover" />
              ) : (
                getAppInitial(appName)
              )}
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-[#6B7280]">
                  App name
                </Label>
                <Input
                  value={appName}
                  disabled
                  className="mt-1 border-[#2A2A30] bg-[#0F0F10] font-medium text-[#E5E7EB]"
                />
                <p className="mt-1 font-mono text-[10px] text-[#6B7280]">
                  NEXT_PUBLIC_APP_NAME
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <ImageIcon className="h-3.5 w-3.5" />
                {logoUrl ? (
                  <span className="truncate font-mono">{logoUrl}</span>
                ) : (
                  <span>No logo URL set</span>
                )}
                <span className="font-mono text-[#4B5563]">· NEXT_PUBLIC_LOGO_URL</span>
              </div>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={Database}
          title="Runtime"
          description="Deployment context visible to superadmins"
        >
          <dl className="space-y-3">
            <EnvRow label="Database driver" value={dbDriver} />
            <EnvRow label="Node environment" value={nodeEnv} />
            <EnvRow label="Settings updated" value={formatDistanceToNow(new Date(updatedAt), { addSuffix: true })} />
            {userEmail ? <EnvRow label="Signed in as" value={userEmail} /> : null}
          </dl>
        </SettingsCard>
      </div>

      <SettingsCard
        icon={Flag}
        title="Feature Flags by Plan"
        description="Control capabilities per subscription tier"
        action={
          <Button
            type="button"
            size="sm"
            disabled={!flagsDirty || savingFlags}
            onClick={() => void saveFlags()}
            className="bg-[#00D4FF] text-[#0F0F10] hover:bg-[#00D4FF]/90 disabled:opacity-40"
          >
            {savingFlags ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        }
      >
        {flagKeys.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#6B7280]">No feature flags configured</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2A30] text-left text-[10px] uppercase tracking-wider text-[#6B7280]">
                  <th className="pb-3 pr-4 font-medium">Plan</th>
                  {flagKeys.map((flag) => (
                    <th key={flag} className="pb-3 px-4 text-center font-medium">
                      {FLAG_LABELS[flag] ?? flag}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_ORDER.filter((plan) => featureFlags[plan]).map((plan) => (
                  <tr key={plan} className="border-b border-[#2A2A30]/50">
                    <td className="py-3 pr-4">
                      <PlanBadge plan={plan} />
                    </td>
                    {flagKeys.map((flag) => (
                      <td key={flag} className="px-4 py-3 text-center">
                        <AdminToggle
                          checked={Boolean(featureFlags[plan]?.[flag])}
                          onChange={(v) => toggleFlag(plan, flag, v)}
                          label={FLAG_LABELS[flag] ?? flag}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {flagsDirty ? (
          <p className="mt-3 font-mono text-[10px] text-[#F59E0B]">Unsaved changes</p>
        ) : null}
      </SettingsCard>

      <SettingsCard
        icon={KeyRound}
        title="Superadmin Account"
        description="Update your platform administrator password"
      >
        <form onSubmit={changePassword} className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current" className="text-[#9CA3AF]">
              Current password
            </Label>
            <PasswordInput
              id="current"
              required
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              className="admin-input h-10 rounded border-[#2A2A30] bg-[#0F0F10] text-[#E5E7EB]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new" className="text-[#9CA3AF]">
              New password
            </Label>
            <PasswordInput
              id="new"
              required
              minLength={8}
              value={passwordForm.password}
              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
              className="admin-input h-10 rounded border-[#2A2A30] bg-[#0F0F10] text-[#E5E7EB]"
            />
          </div>
          <Button
            type="submit"
            disabled={savingPassword}
            className="bg-[#00D4FF] text-[#0F0F10] hover:bg-[#00D4FF]/90"
          >
            {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </Button>
        </form>
      </SettingsCard>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded border border-[#00D4FF]/20 bg-[#1A1A1E] p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-[#00D4FF]/20 bg-[#00D4FF]/10">
            <Icon className="h-4 w-4 text-[#00D4FF]" />
          </span>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#E5E7EB]">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-[#6B7280]">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EnvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#2A2A30]/50 pb-2 last:border-0 last:pb-0">
      <dt className="flex items-center gap-2 text-xs text-[#6B7280]">
        <Globe className="h-3 w-3" />
        {label}
      </dt>
      <dd className="admin-tabular truncate font-mono text-xs text-[#00D4FF]">{value}</dd>
    </div>
  );
}

function AdminToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative mx-auto inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
        checked
          ? "border-[#00D4FF] bg-[#00D4FF]/25"
          : "border-[#2A2A30] bg-[#0F0F10]",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full transition-transform",
          checked ? "translate-x-[18px] bg-[#00D4FF]" : "translate-x-0.5 bg-[#6B7280]",
        )}
      />
    </button>
  );
}
