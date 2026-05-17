import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppShell } from "@/components/app/AppShell";
import { getCompanyRepository } from "@/lib/db/factory";
import { authMono, authSans } from "@/lib/fonts/auth-fonts";
import { getMockNotifications } from "@/lib/mock/app";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const companyId = session.user.companyId;
  const company = companyId ? await getCompanyRepository().findById(companyId) : null;
  const companyName = company?.name ?? "Workspace";
  const companyInitial = companyName.charAt(0).toUpperCase();

  const unreadCount = getMockNotifications().filter((n) => !n.read).length;

  return (
    <div className={`app-theme min-h-screen font-sans ${authSans.variable} ${authMono.variable}`}>
      <AppShell
        companyName={companyName}
        companyInitial={companyInitial}
        userName={session.user.name}
        userEmail={session.user.email}
        unreadCount={unreadCount}
      >
        {children}
      </AppShell>
    </div>
  );
}
