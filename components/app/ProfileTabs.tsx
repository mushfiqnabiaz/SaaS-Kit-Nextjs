"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SessionList } from "@/components/app/SessionList";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const tabs = ["personal", "security", "notifications"] as const;
type Tab = (typeof tabs)[number];

interface ProfileTabsProps {
  userId: string;
  defaultName: string;
  email: string;
}

export function ProfileTabs({ userId, defaultName, email }: ProfileTabsProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("personal");
  const [name, setName] = useState(defaultName);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notifyInvite, setNotifyInvite] = useState(true);
  const [notifyRole, setNotifyRole] = useState(true);
  const [notifySecurity, setNotifySecurity] = useState(true);

  async function savePersonal() {
    setSaving(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    setMessage(res.ok ? "Profile updated" : "Failed to save");
    if (res.ok) router.refresh();
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword, currentPassword }),
    });
    setSaving(false);
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated");
    } else {
      setMessage("Failed to update password");
    }
  }

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b border-[#1E293B] pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-t-lg px-4 py-2 text-sm font-medium capitalize",
              tab === t
                ? "border-b-2 border-[#818CF8] text-[#A5B4FC]"
                : "text-[#64748B] hover:text-[#94A3B8]",
            )}
          >
            {t === "personal" ? "Personal Info" : t}
          </button>
        ))}
      </nav>

      {message ? <p className="text-sm text-[#818CF8]">{message}</p> : null}

      {tab === "personal" ? (
        <section className="space-y-5 rounded-2xl border border-[#1E293B] bg-[#111827] p-6">
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Full name</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="app-input"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Email</Label>
            <input value={email} disabled className="app-input opacity-60" />
            <p className="text-xs text-[#64748B]">Contact your admin to change your email</p>
          </div>
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Bio / About</Label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              rows={4}
              maxLength={200}
              className="app-input resize-none"
              placeholder="A short intro about you..."
            />
            <p className="text-right text-xs text-[#64748B]">{bio.length}/200</p>
          </div>
          <Button
            type="button"
            onClick={() => void savePersonal()}
            disabled={saving}
            className="bg-[#818CF8] hover:bg-[#818CF8]/90"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        </section>
      ) : null}

      {tab === "security" ? (
        <div className="space-y-8">
          <section className="rounded-2xl border border-[#1E293B] bg-[#111827] p-6">
            <h3 className="font-semibold text-[#F1F5F9]">Change password</h3>
            <form onSubmit={updatePassword} className="mt-4 max-w-md space-y-4">
              <div className="space-y-2">
                <Label className="text-[#94A3B8]">Current password</Label>
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="app-input h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#94A3B8]">New password</Label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="app-input h-11"
                  required
                />
                <PasswordStrength password={newPassword} />
              </div>
              <div className="space-y-2">
                <Label className="text-[#94A3B8]">Confirm new password</Label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="app-input h-11"
                  required
                />
              </div>
              <Button type="submit" disabled={saving} className="bg-[#818CF8]">
                Update password
              </Button>
            </form>
          </section>
          <section className="rounded-2xl border border-[#1E293B] bg-[#111827] p-6">
            <h3 className="font-semibold text-[#F1F5F9]">Active sessions</h3>
            <div className="mt-4">
              <SessionList />
            </div>
          </section>
        </div>
      ) : null}

      {tab === "notifications" ? (
        <section className="space-y-4 rounded-2xl border border-[#1E293B] bg-[#111827] p-6">
          <Toggle
            label="Someone invites me to a new team"
            checked={notifyInvite}
            onChange={setNotifyInvite}
          />
          <Toggle label="My role changes" checked={notifyRole} onChange={setNotifyRole} />
          <Toggle
            label="Important security events"
            checked={notifySecurity}
            onChange={setNotifySecurity}
          />
          <Button type="button" className="mt-2 bg-[#818CF8]">
            Save preferences
          </Button>
        </section>
      ) : null}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-[#E2E8F0]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-[#818CF8]"
      />
    </label>
  );
}
