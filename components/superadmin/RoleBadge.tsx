import { ROLE_LABELS, type Role } from "@/config/roles";
import { cn } from "@/lib/utils";

const styles: Record<Role, string> = {
  superadmin: "border-[#A855F7]/40 bg-[#A855F7]/10 text-[#C084FC]",
  company_admin: "border-[#00D4FF]/40 bg-[#00D4FF]/10 text-[#00D4FF]",
  user: "border-[#6B7280]/40 bg-[#6B7280]/10 text-[#9CA3AF]",
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        styles[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
