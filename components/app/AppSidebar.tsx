"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, LayoutDashboard, LogOut, UserCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/profile", label: "My Profile", icon: UserCircle },
  { href: "/app/team", label: "Team", icon: Users },
  { href: "/app/notifications", label: "Notifications", icon: Bell },
] as const;

interface AppSidebarProps {
  companyName: string;
  companyInitial: string;
  userName?: string | null;
  userEmail?: string | null;
  onNavigate?: () => void;
}

export function AppSidebar({
  companyName,
  companyInitial,
  userName,
  userEmail,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-[#1E293B] bg-[#0A0E1A]">
      <div className="border-b border-[#1E293B] px-4 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#818CF8]/15 text-sm font-bold text-[#818CF8]">
            {companyInitial}
          </span>
          <p className="truncate text-sm font-medium text-[#E2E8F0]">{companyName}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#818CF8]/12 text-[#A5B4FC]"
                  : "text-[#94A3B8] hover:bg-[#111827] hover:text-[#E2E8F0]",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1E293B] p-4">
        <div className="flex items-center gap-3">
          <span className="app-glow-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#818CF8]/20 text-xs font-semibold text-[#A5B4FC]">
            {(userName ?? "U").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName ?? "User"}</p>
            <p className="truncate text-[11px] text-[#64748B]">{userEmail}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#1E293B] py-2 text-xs text-[#94A3B8] hover:border-[#818CF8]/30 hover:text-[#A5B4FC]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
