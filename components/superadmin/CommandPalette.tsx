"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Building2, LayoutDashboard, ScrollText, Settings, Users } from "lucide-react";

const items = [
  { href: "/superadmin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/superadmin/companies", label: "Companies", icon: Building2 },
  { href: "/superadmin/users", label: "Users", icon: Users },
  { href: "/superadmin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/superadmin/settings", label: "Settings", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-command-trigger]")) setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] p-4"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <Command
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-lg border border-[#00D4FF]/30 bg-[#1A1A1E] shadow-2xl"
        label="Global search"
      >
        <Command.Input
          placeholder="Search pages..."
          className="w-full border-b border-[#2A2A30] bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#6B7280]"
        />
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-[#6B7280]">
            No results found.
          </Command.Empty>
          <Command.Group heading="Navigation" className="text-[10px] uppercase text-[#6B7280]">
            {items.map(({ href, label, icon: Icon }) => (
              <Command.Item
                key={href}
                value={label}
                onSelect={() => {
                  setOpen(false);
                  router.push(href);
                }}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm text-[#E5E7EB] aria-selected:bg-[#00D4FF]/15 aria-selected:text-[#00D4FF]"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
