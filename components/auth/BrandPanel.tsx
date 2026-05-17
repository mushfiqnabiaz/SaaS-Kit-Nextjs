import { Building2, FileText, Shield } from "lucide-react";
import { getAppInitial, PUBLIC_APP_NAME } from "@/lib/app-config";

const features = [
  {
    icon: Building2,
    title: "Multi-tenant ready",
    description: "Shared database with tenant-scoped rows on every query.",
  },
  {
    icon: Shield,
    title: "Role-based access",
    description: "Superadmin, company admin, and user — enforced at the edge.",
  },
  {
    icon: FileText,
    title: "Audit logging",
    description: "Every mutation tracked with actor, action, and context.",
  },
] as const;

const TAGLINE = "Ship your SaaS on infrastructure that already scales.";

export function BrandPanel() {
  const initial = getAppInitial();

  return (
    <aside className="auth-geometric-bg relative hidden min-h-screen flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
      <div
        aria-hidden
        className="auth-shape-accent absolute right-[12%] top-[18%] h-32 w-32 rotate-12"
      />
      <div
        aria-hidden
        className="auth-shape-accent absolute bottom-[28%] left-[8%] h-20 w-48 -rotate-6"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/3 h-px w-2/3 bg-gradient-to-l from-[hsl(var(--auth-accent)/0.35)] to-transparent"
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[hsl(var(--auth-accent)/0.35)] bg-[hsl(var(--auth-accent)/0.12)] font-mono text-lg font-bold text-[hsl(var(--auth-accent))] shadow-[0_0_32px_-8px_hsl(var(--auth-accent)/0.4)]"
            aria-hidden
          >
            {initial}
          </span>
          <span className="text-lg font-semibold tracking-tight text-[hsl(var(--auth-fg))]">
            {PUBLIC_APP_NAME}
          </span>
        </div>

        <p className="mt-12 max-w-sm text-sm font-medium uppercase tracking-[0.18em] text-[hsl(var(--auth-accent))]">
          Production-ready
        </p>
        <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight text-[hsl(var(--auth-fg))] xl:text-4xl">
          {TAGLINE}
        </h2>
      </div>

      <ul className="relative z-10 mt-auto space-y-7 pt-16">
        {features.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[hsl(var(--auth-border))] bg-[hsl(var(--auth-surface-elevated))]">
              <Icon className="h-4 w-4 text-[hsl(var(--auth-accent))]" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-medium text-[hsl(var(--auth-fg))]">{title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-[hsl(var(--auth-muted))]">
                {description}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="relative z-10 mt-12 text-xs text-[hsl(var(--auth-muted))]">
        © {new Date().getFullYear()} {PUBLIC_APP_NAME}
      </p>
    </aside>
  );
}
