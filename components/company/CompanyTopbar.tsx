"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const titles: Record<string, string> = {
  "/company/dashboard": "Dashboard",
  "/company/users": "Team",
  "/company/users/invite": "Invite",
  "/company/audit-logs": "Audit Logs",
  "/company/settings": "Settings",
};

function resolveTitle(pathname: string): string {
  return titles[pathname] ?? "Company";
}

interface CompanyTopbarProps {
  onMenuClick?: () => void;
}

export function CompanyTopbar({ onMenuClick }: CompanyTopbarProps) {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-[#30363D] bg-[#0D1117]/95 px-4 backdrop-blur lg:px-8">
      <button
        type="button"
        className="rounded-lg border border-[#30363D] p-2 text-[#8B949E] lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-semibold tracking-tight text-[#E6EDF3]">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <Button
          asChild
          size="sm"
          className="hidden bg-[#6366F1] text-white hover:bg-[#6366F1]/90 sm:inline-flex"
        >
          <Link href="/company/users/invite">
            <UserPlus className="h-4 w-4" />
            Invite member
          </Link>
        </Button>
        <button
          type="button"
          className="relative rounded-lg border border-[#30363D] p-2 text-[#8B949E] hover:text-[#818CF8]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#6366F1] text-[9px] font-bold text-white">
            2
          </span>
        </button>
      </div>
    </header>
  );
}
