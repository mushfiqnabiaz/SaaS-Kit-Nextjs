import { ROLES, type Role } from "@/config/roles";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  [ROLES.COMPANY_ADMIN]: "border-[#6366F1]/40 bg-[#6366F1]/15 text-[#818CF8]",
  [ROLES.USER]: "border-[#30363D] bg-[#21262D] text-[#8B949E]",
  [ROLES.SUPERADMIN]: "border-[#A78BFA]/40 bg-[#A78BFA]/15 text-[#C4B5FD]",
};

const labels: Record<string, string> = {
  [ROLES.COMPANY_ADMIN]: "Admin",
  [ROLES.USER]: "User",
  [ROLES.SUPERADMIN]: "Superadmin",
};

export function CompanyRoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        styles[role] ?? styles[ROLES.USER],
        className,
      )}
    >
      {labels[role] ?? role}
    </span>
  );
}
