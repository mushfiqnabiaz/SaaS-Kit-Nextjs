"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Bell, LayoutDashboard, UserCircle, Users } from "lucide-react";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppTopbar } from "@/components/app/AppTopbar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  companyName: string;
  companyInitial: string;
  userName?: string | null;
  userEmail?: string | null;
  unreadCount?: number;
}

const mobileLinks = [
  { href: "/app/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/app/team", label: "Team", icon: Users },
  { href: "/app/notifications", label: "Alerts", icon: Bell },
  { href: "/app/profile", label: "Profile", icon: UserCircle },
] as const;

export function AppShell({
  children,
  companyName,
  companyInitial,
  userName,
  userEmail,
  unreadCount = 0,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen pb-16 lg:pb-0">
      <div className="hidden lg:flex">
        <AppSidebar
          companyName={companyName}
          companyInitial={companyInitial}
          userName={userName}
          userEmail={userEmail}
        />
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <AppSidebar
              companyName={companyName}
              companyInitial={companyInitial}
              userName={userName}
              userEmail={userEmail}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          onMenuClick={() => setMobileOpen(true)}
          userName={userName}
          userInitial={(userName ?? "U").charAt(0)}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[#1E293B] bg-[#0A0E1A] lg:hidden">
        {mobileLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px]",
                active ? "text-[#A5B4FC]" : "text-[#64748B]",
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
