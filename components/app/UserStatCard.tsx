interface UserStatCardProps {
  label: string;
  value: string;
  indicator?: "active" | "none";
}

export function UserStatCard({ label, value, indicator = "none" }: UserStatCardProps) {
  return (
    <article className="rounded-2xl border border-[#1E293B] bg-[#111827] p-6">
      <p className="text-sm font-medium text-[#64748B]">{label}</p>
      <div className="mt-3 flex items-center gap-2">
        {indicator === "active" ? (
          <span className="h-2 w-2 rounded-full bg-[#34D399]" aria-hidden />
        ) : null}
        <p className="text-xl font-semibold text-[#F1F5F9]">{value}</p>
      </div>
    </article>
  );
}
