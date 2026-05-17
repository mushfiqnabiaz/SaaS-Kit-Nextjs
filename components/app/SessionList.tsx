"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionItem {
  id: string;
  deviceInfo: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export function SessionList() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/auth/sessions");
    const json = (await res.json()) as { data: SessionItem[] | null };
    setSessions(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(id: string) {
    const res = await fetch(`/api/auth/sessions/${id}`, { method: "DELETE" });
    if (res.ok) {
      const item = sessions.find((s) => s.id === id);
      if (item?.isCurrent) {
        await signOut({ callbackUrl: "/login" });
        return;
      }
      void load();
    }
  }

  async function signOutAll() {
    const res = await fetch("/api/auth/sessions", { method: "DELETE" });
    if (res.ok) await signOut({ callbackUrl: "/login" });
  }

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin text-[#64748B]" />;
  }

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <p className="text-sm text-[#64748B]">No active sessions.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#1E293B]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] text-left text-[10px] uppercase text-[#64748B]">
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-[#1E293B]/50">
                  <td className="px-4 py-3 text-[#E2E8F0]">
                    {s.deviceInfo}
                    {s.isCurrent ? (
                      <span className="ml-2 text-xs text-[#34D399]">(this device)</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">
                    {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!s.isCurrent ? (
                      <button
                        type="button"
                        onClick={() => void revoke(s.id)}
                        className="text-xs text-[#818CF8] hover:underline"
                      >
                        Revoke
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        className="border-[#F87171]/50 text-[#F87171] hover:bg-[#F87171]/10"
        disabled={sessions.length <= 1}
        onClick={() => void signOutAll()}
      >
        Sign out all devices
      </Button>
    </div>
  );
}
