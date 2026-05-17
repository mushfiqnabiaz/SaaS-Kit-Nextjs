"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, Settings, UserPlus, Users } from "lucide-react";
import { CompanySidebar } from "@/components/company/CompanySidebar";
import { CompanyTopbar } from "@/components/company/CompanyTopbar";
import { cn } from "@/lib/utils";

interface CompanyShellProps {
  children: ReactNode;
  companyName: string;
  companyInitial: string;
  userName?: string | null;
  userEmail?: string | null;
}

const mobileLinks = [
  { href: "/company/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/company/users", label: "Team", icon: Users },
  { href: "/company/users/invite", label: "Invite", icon: UserPlus },
  { href: "/company/settings", label: "Settings", icon: Settings },
] as const;

export function CompanyShell({
  children,
  companyName,
  companyInitial,
  userName,
  userEmail,
}: CompanyShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen pb-16 lg:pb-0">
      <div className="hidden lg:flex">
        <CompanySidebar
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
            <CompanySidebar
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
        <CompanyTopbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-6 lg:p-8">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[#30363D] bg-[#0D1117] lg:hidden">
        {mobileLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px]",
                active ? "text-[#6366F1]" : "text-[#6E7681]",
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
