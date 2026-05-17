"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PUBLIC_APP_NAME, getAppInitial } from "@/lib/app-config";

const links = [
  { href: "/superadmin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/superadmin/companies", label: "Companies", icon: Building2 },
  { href: "/superadmin/users", label: "Users", icon: Users },
  { href: "/superadmin/audit-logs", label: "Audit Logs", icon: FileText },
  { href: "/superadmin/settings", label: "Settings", icon: Settings },
] as const;

interface SuperadminSidebarProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function SuperadminSidebar({ userName, userEmail }: SuperadminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <>
      <div className="border-b border-border px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Superadmin
        </p>
        <p className="mt-1 font-semibold">{PUBLIC_APP_NAME}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getAppInitial(userName ?? "A")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName ?? "Admin"}</p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 rounded-lg border border-border bg-card p-2 lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded p-1 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
        {nav}
      </aside>
    </>
  );
}
