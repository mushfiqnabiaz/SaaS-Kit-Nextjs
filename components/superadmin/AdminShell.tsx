"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Building2,
  LayoutDashboard,
  ScrollText,
  Users,
} from "lucide-react";
import { AdminSidebar } from "@/components/superadmin/AdminSidebar";
import { AdminTopbar } from "@/components/superadmin/AdminTopbar";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  children: ReactNode;
  userName?: string | null;
  userEmail?: string | null;
}

const mobileLinks = [
  { href: "/superadmin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/superadmin/companies", label: "Companies", icon: Building2 },
  { href: "/superadmin/users", label: "Users", icon: Users },
  { href: "/superadmin/audit-logs", label: "Logs", icon: ScrollText },
] as const;

export function AdminShell({ children, userName, userEmail }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen pb-14 lg:pb-0">
      <div className="hidden lg:flex">
        <AdminSidebar userName={userName} userEmail={userEmail} />
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <AdminSidebar
              userName={userName}
              userEmail={userEmail}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[#2A2A30] bg-[#0F0F10] lg:hidden">
        {mobileLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[10px]",
                active ? "text-[#00D4FF]" : "text-[#6B7280]",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
