interface WelcomeCardProps {
  firstName: string;
  roleLabel: string;
  lastLoginText: string;
  avatarInitial: string;
}

export function WelcomeCard({
  firstName,
  roleLabel,
  lastLoginText,
  avatarInitial,
}: WelcomeCardProps) {
  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#111827] p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-[#F8FAFC]">
            Welcome back, {firstName}
          </h2>
          <p className="text-base text-[#94A3B8]">{roleLabel}</p>
          <p className="text-sm text-[#64748B]">{lastLoginText}</p>
        </div>
        <span className="app-glow-avatar flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#818CF8]/20 text-2xl font-bold text-[#A5B4FC]">
          {avatarInitial}
        </span>
      </div>
    </section>
  );
}
