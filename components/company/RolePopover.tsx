"use client";

import { useEffect, useState } from "react";
import { ROLES, type Role } from "@/config/roles";
import { MemberRoleLabel } from "@/components/company/MemberRoleLabel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface CompanyRoleOption {
  id: string;
  name: string;
}

interface RolePopoverProps {
  userId: string;
  currentRole: Role;
  currentCompanyRoleId?: string | null; // reserved for future highlight
  currentCompanyRoleName?: string | null;
  memberName: string;
  onChanged?: () => void;
}

export function RolePopover({
  userId,
  currentRole,
  currentCompanyRoleName,
  memberName,
  onChanged,
}: RolePopoverProps) {
  const [open, setOpen] = useState(false);
  const [confirmAdmin, setConfirmAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companyRoles, setCompanyRoles] = useState<CompanyRoleOption[]>([]);

  useEffect(() => {
    if (!open) return;
    void fetch("/api/company/roles")
      .then((res) => res.json())
      .then((json: { data?: CompanyRoleOption[] }) => {
        if (json.data) setCompanyRoles(json.data.map((r) => ({ id: r.id, name: r.name })));
      })
      .catch(() => undefined);
  }, [open]);

  async function patchUser(body: Record<string, unknown>) {
    setLoading(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      setConfirmAdmin(false);
      onChanged?.();
    }
  }

  async function changeRole(role: Role, companyRoleId: string | null = null) {
    await patchUser({ role, companyRoleId });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer">
          <MemberRoleLabel role={currentRole} companyRoleName={currentCompanyRoleName} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56">
        {confirmAdmin ? (
          <div className="space-y-3 p-1">
            <p className="text-xs text-[#8B949E]">
              Make <strong className="text-[#E6EDF3]">{memberName}</strong> a company admin?
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 border-[#30363D]"
                onClick={() => setConfirmAdmin(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1 bg-[#6366F1]"
                disabled={loading}
                onClick={() => void changeRole(ROLES.COMPANY_ADMIN, null)}
              >
                Confirm
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <button
              type="button"
              className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-[#21262D]"
              onClick={() => void changeRole(ROLES.USER, null)}
            >
              Default member
            </button>
            {companyRoles.map((r) => (
              <button
                key={r.id}
                type="button"
                className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-[#21262D]"
                onClick={() => void changeRole(ROLES.USER, r.id)}
              >
                {r.name}
              </button>
            ))}
            <button
              type="button"
              className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-[#21262D]"
              onClick={() => setConfirmAdmin(true)}
            >
              Company Admin
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
