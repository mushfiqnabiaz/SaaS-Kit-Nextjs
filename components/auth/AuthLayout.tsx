import type { ReactNode } from "react";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { getAppInitial, PUBLIC_APP_NAME } from "@/lib/app-config";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const initial = getAppInitial();

  return (
    <div className="auth-theme min-h-screen lg:grid lg:grid-cols-[45fr_55fr]">
      <BrandPanel />

      <main className="flex min-h-screen flex-col justify-center bg-[hsl(var(--auth-bg))] px-5 py-10 sm:px-10 lg:px-14 xl:px-16">
        <div className="auth-fade-up mx-auto w-full max-w-[400px]">
          {/* Mobile brand mark */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[hsl(var(--auth-accent)/0.35)] bg-[hsl(var(--auth-accent)/0.1)] font-mono text-sm font-bold text-[hsl(var(--auth-accent))]">
              {initial}
            </span>
            <span className="text-base font-semibold">{PUBLIC_APP_NAME}</span>
          </div>

          <header className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--auth-fg))] sm:text-[1.75rem]">
              {title}
            </h1>
            <p className="mt-2 text-sm text-[hsl(var(--auth-muted))]">{subtitle}</p>
          </header>

          {children}
        </div>
      </main>
    </div>
  );
}
