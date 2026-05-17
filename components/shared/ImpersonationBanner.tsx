"use client";

import { useSession } from "next-auth/react";
import { AlertTriangle } from "lucide-react";

export function ImpersonationBanner() {
  const { data: session } = useSession();

  if (!session?.impersonatedBy) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-800 dark:text-amber-200">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        Impersonation mode — you are viewing as <strong>{session.user.name}</strong>. Session
        expires in 15 minutes.
      </span>
    </div>
  );
}
