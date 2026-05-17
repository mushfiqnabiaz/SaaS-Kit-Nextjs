import { ROLE_LABELS, ROLES, type Role } from "@/config/roles";
import { cn } from "@/lib/utils";

interface TeammateCardProps {
  name: string;
  email: string;
  role: Role;
  isAdmin: boolean;
}

export function TeammateCard({ name, email, role, isAdmin }: TeammateCardProps) {
  const initial = name.charAt(0).toUpperCase();
  const isAdminRole = role === ROLES.COMPANY_ADMIN;

  return (
    <article className="rounded-2xl border border-[#1E293B] bg-[#111827] p-5 text-center transition-colors hover:border-[#818CF8]/30">
      <span
        className={cn(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold",
          isAdminRole ? "bg-[#6366F1]/20 text-[#A5B4FC]" : "bg-[#334155]/50 text-[#94A3B8]",
        )}
      >
        {initial}
      </span>
      <p className="mt-3 font-medium text-[#F1F5F9]">{name}</p>
      <p className="mt-1 text-xs text-[#64748B]">
        {isAdmin ? "Admin" : ROLE_LABELS[role] === "User" ? "Member" : ROLE_LABELS[role]}
      </p>
      <a
        href={`mailto:${email}`}
        className="mt-2 inline-block text-xs text-[#818CF8] hover:underline"
      >
        {email}
      </a>
    </article>
  );
}
