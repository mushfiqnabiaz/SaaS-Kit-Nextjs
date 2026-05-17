"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/company/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/company/users", label: "Team", icon: Users, exact: true },
  { href: "/company/roles", label: "Roles", icon: Shield, exact: true },
  { href: "/company/users/invite", label: "Invite", icon: UserPlus, exact: false },
  { href: "/company/audit-logs", label: "Audit Logs", icon: ScrollText, exact: true },
  { href: "/company/settings", label: "Settings", icon: Settings, exact: true },
] as const;

interface CompanySidebarProps {
  companyName: string;
  companyInitial: string;
  userName?: string | null;
  userEmail?: string | null;
  onNavigate?: () => void;
}

function isLinkActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CompanySidebar({
  companyName,
  companyInitial,
  userName,
  userEmail,
  onNavigate,
}: CompanySidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-[#30363D] bg-[#0D1117]">
      <div className="border-b border-[#30363D] px-4 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366F1]/15 text-lg font-bold text-[#6366F1]">
            {companyInitial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{companyName}</p>
            <p className="text-[10px] uppercase tracking-wider text-[#6E7681]">Workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = isLinkActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#6366F1]/15 text-[#818CF8]"
                  : "text-[#8B949E] hover:bg-[#161B22] hover:text-[#E6EDF3]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#30363D] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/20 text-xs font-semibold text-[#818CF8]">
            {(userName ?? "A").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName ?? "Admin"}</p>
            <p className="truncate text-[11px] text-[#6E7681]">{userEmail}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#30363D] py-2 text-xs text-[#8B949E] transition-colors hover:border-[#6366F1]/40 hover:text-[#818CF8]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
