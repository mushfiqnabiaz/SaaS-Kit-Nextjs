"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, Moon, Search } from "lucide-react";
import { CommandPalette } from "@/components/superadmin/CommandPalette";

const titles: Record<string, string> = {
  "/superadmin/dashboard": "Overview",
  "/superadmin/companies": "Companies",
  "/superadmin/users": "Users",
  "/superadmin/audit-logs": "Audit Logs",
  "/superadmin/settings": "Settings",
};

function resolveTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/superadmin/companies/")) return "Company Details";
  return "Admin";
}

interface AdminTopbarProps {
  onMenuClick?: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-[#2A2A30] bg-[#0F0F10]/95 px-4 backdrop-blur lg:px-6">
        <button
          type="button"
          className="rounded border border-[#2A2A30] p-2 text-[#9CA3AF] lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="hidden items-center gap-2 rounded border border-[#2A2A30] px-3 py-1.5 text-xs text-[#6B7280] transition-colors hover:border-[#00D4FF]/30 hover:text-[#9CA3AF] sm:flex"
            data-command-trigger
          >
            <Search className="h-3.5 w-3.5" />
            <span className="font-mono">⌘K</span>
            <span className="hidden md:inline">Search</span>
          </button>
          <button
            type="button"
            className="relative rounded border border-[#2A2A30] p-2 text-[#9CA3AF] hover:text-[#00D4FF]"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00D4FF] font-mono text-[9px] font-bold text-[#0F0F10]">
              3
            </span>
          </button>
          <button
            type="button"
            className="rounded border border-[#2A2A30] p-2 text-[#9CA3AF] hover:text-[#00D4FF]"
            aria-label="Toggle theme"
          >
            <Moon className="h-4 w-4" />
          </button>
        </div>
      </header>
      <CommandPalette />
    </>
  );
}
