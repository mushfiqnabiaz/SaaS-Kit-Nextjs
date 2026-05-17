"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, ChevronDown, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const titles: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/profile": "My Profile",
  "/app/team": "Team",
  "/app/notifications": "Notifications",
};

interface AppTopbarProps {
  onMenuClick?: () => void;
  userName?: string | null;
  userInitial?: string;
  unreadCount?: number;
}

export function AppTopbar({
  onMenuClick,
  userName,
  userInitial = "U",
  unreadCount = 0,
}: AppTopbarProps) {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Workspace";

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-[#1E293B] bg-[#0A0E1A]/90 px-4 backdrop-blur lg:px-8">
      <button
        type="button"
        className="rounded-lg border border-[#1E293B] p-2 text-[#94A3B8] lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-semibold text-[#F1F5F9]">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/app/notifications"
          className="relative rounded-lg border border-[#1E293B] p-2 text-[#94A3B8] hover:text-[#A5B4FC]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#818CF8] text-[9px] font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl border border-[#1E293B] py-1.5 pl-1.5 pr-2 hover:border-[#818CF8]/40">
            <span className="app-glow-avatar flex h-8 w-8 items-center justify-center rounded-full bg-[#818CF8]/20 text-xs font-semibold text-[#A5B4FC]">
              {userInitial.charAt(0).toUpperCase()}
            </span>
            <ChevronDown className="h-4 w-4 text-[#64748B]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-[#1E293B] bg-[#111827]">
            <p className="px-2 py-1.5 text-xs text-[#64748B]">{userName}</p>
            <DropdownMenuSeparator className="bg-[#1E293B]" />
            <DropdownMenuItem asChild>
              <Link href="/app/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
