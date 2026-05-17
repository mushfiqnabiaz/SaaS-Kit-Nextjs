"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionItem {
  id: string;
  deviceInfo: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export function SessionsPanel() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/auth/sessions");
    const json = (await res.json()) as { data: SessionItem[] | null };
    setSessions(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function revokeSession(id: string) {
    const res = await fetch(`/api/auth/sessions/${id}`, { method: "DELETE" });
    if (res.ok) {
      const item = sessions.find((s) => s.id === id);
      if (item?.isCurrent) {
        await signOut({ callbackUrl: "/login" });
        return;
      }
      void loadSessions();
    }
  }

  async function revokeAllOthers() {
    const res = await fetch("/api/auth/sessions", { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/login" });
    }
  }

  return (
    <section className="max-w-md space-y-3">
      <h2 className="text-lg font-semibold">Active sessions</h2>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active sessions found.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">
                  {session.deviceInfo}
                  {session.isCurrent ? (
                    <span className="ml-2 text-xs text-emerald-600">(this device)</span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  Started {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </div>
              {!session.isCurrent ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void revokeSession(session.id)}
                >
                  Revoke
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={loading || sessions.length <= 1}
        onClick={() => void revokeAllOthers()}
      >
        Sign out everywhere
      </Button>
    </section>
  );
}
