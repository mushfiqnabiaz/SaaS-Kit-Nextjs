import type { Role } from "@/config/roles";
import { CompanyRoleBadge } from "@/components/company/CompanyRoleBadge";

interface ProfileCardProps {
  name: string;
  email: string;
  role: Role;
  companyName: string | null;
  memberSince: string;
}

export function ProfileCard({ name, email, role, companyName, memberSince }: ProfileCardProps) {
  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#111827] p-8 text-center lg:text-left">
      <span className="app-glow-avatar mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#818CF8]/20 text-2xl font-bold text-[#A5B4FC] lg:mx-0">
        {name.charAt(0).toUpperCase()}
      </span>
      <button
        type="button"
        className="mt-4 rounded-xl border border-[#1E293B] px-4 py-2 text-xs text-[#94A3B8] hover:border-[#818CF8]/40"
        disabled
      >
        Upload photo
      </button>
      <input type="file" className="hidden" accept="image/*" aria-hidden />
      <h2 className="mt-6 text-2xl font-semibold text-[#F8FAFC]">{name}</h2>
      <p className="mt-1 text-sm text-[#64748B]">{email}</p>
      <div className="mt-4 flex justify-center lg:justify-start">
        <CompanyRoleBadge role={role} />
      </div>
      {companyName ? (
        <p className="mt-3 text-sm text-[#94A3B8]">{companyName}</p>
      ) : null}
      <p className="mt-1 text-xs text-[#64748B]">Member since {memberSince}</p>
    </section>
  );
}
