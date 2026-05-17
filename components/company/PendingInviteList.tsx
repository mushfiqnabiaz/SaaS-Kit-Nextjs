"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Mail } from "lucide-react";
import type { Role } from "@/config/roles";
import { MemberRoleLabel } from "@/components/company/MemberRoleLabel";
import { Button } from "@/components/ui/button";

export interface PendingInviteItem {
  id: string;
  email: string;
  role: Role;
  companyRoleName?: string | null;
  createdAt: string;
}

export function PendingInviteList({ invites }: { invites: PendingInviteItem[] }) {
  const router = useRouter();

  async function resend(id: string) {
    await fetch(`/api/users/invite/${id}/resend`, { method: "POST" });
    router.refresh();
  }

  async function revoke(id: string) {
    await fetch(`/api/users/invite/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="mt-10 rounded-xl border border-[#30363D] bg-[#161B22] p-5">
      <h2 className="text-sm font-semibold text-[#E6EDF3]">Pending invites</h2>
      {invites.length === 0 ? (
        <p className="mt-6 text-center text-sm text-[#6E7681]">No pending invites</p>
      ) : (
        <ul className="mt-4 divide-y divide-[#30363D]">
          {invites.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#21262D]">
                  <Mail className="h-4 w-4 text-[#6E7681]" />
                </span>
                <div>
                  <p className="text-sm font-medium text-[#E6EDF3]">{inv.email}</p>
                  <p className="text-[11px] text-[#6E7681]">
                    Sent {formatDistanceToNow(new Date(inv.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MemberRoleLabel role={inv.role} companyRoleName={inv.companyRoleName} />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-[#30363D] text-xs"
                  onClick={() => void resend(inv.id)}
                >
                  Resend
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-[#F87171]/40 text-xs text-[#F87171]"
                  onClick={() => void revoke(inv.id)}
                >
                  Revoke
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
