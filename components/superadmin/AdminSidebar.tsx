"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import { PUBLIC_APP_NAME, getAppInitial } from "@/lib/app-config";
import { cn } from "@/lib/utils";

const links = [
  { href: "/superadmin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/superadmin/companies", label: "Companies", icon: Building2 },
  { href: "/superadmin/users", label: "Users", icon: Users },
  { href: "/superadmin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/superadmin/settings", label: "Settings", icon: Settings },
] as const;

interface AdminSidebarProps {
  userName?: string | null;
  userEmail?: string | null;
  onNavigate?: () => void;
}

export function AdminSidebar({ userName, userEmail, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-[#2A2A30] bg-[#0F0F10]">
      <div className="border-b border-[#2A2A30] px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-[#00D4FF]/15 font-mono text-sm font-bold text-[#00D4FF]">
            {getAppInitial()}
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">{PUBLIC_APP_NAME}</p>
            <span className="mt-0.5 inline-block rounded border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-widest text-[#00D4FF]">
              Admin
            </span>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 border-l-2 py-2 pl-3 pr-2 text-sm font-medium transition-colors",
                active
                  ? "border-[#00D4FF] bg-[#00D4FF]/10 text-[#00D4FF]"
                  : "border-transparent text-[#9CA3AF] hover:bg-[#1A1A1E] hover:text-[#E5E7EB]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#2A2A30] p-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#00D4FF]/10 font-mono text-xs font-semibold text-[#00D4FF]">
            {getAppInitial(userName ?? "A")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName ?? "Admin"}</p>
            <p className="truncate font-mono text-[10px] text-[#6B7280]">{userEmail}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-[#2A2A30] py-2 text-xs text-[#9CA3AF] transition-colors hover:border-[#00D4FF]/30 hover:text-[#00D4FF]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
