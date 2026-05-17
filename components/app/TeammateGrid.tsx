import Link from "next/link";
import { TeammateCard } from "@/components/app/TeammateCard";
import type { TeammatePreview } from "@/lib/data/app";

interface TeammateGridProps {
  teammates: TeammatePreview[];
  totalCount: number;
  title?: string;
}

export function TeammateGrid({
  teammates,
  totalCount,
  title = "Team members",
}: TeammateGridProps) {
  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#111827] p-6">
      <h2 className="text-lg font-semibold text-[#F1F5F9]">{title}</h2>
      {teammates.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[#64748B]">No teammates to show yet</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {teammates.map((t) => (
            <TeammateCard
              key={t.id}
              name={t.name}
              email={t.email}
              role={t.role}
              isAdmin={t.isAdmin}
            />
          ))}
        </div>
      )}
      {totalCount > teammates.length ? (
        <Link
          href="/app/team"
          className="mt-5 inline-block text-sm font-medium text-[#818CF8] hover:underline"
        >
          View all {totalCount} teammates →
        </Link>
      ) : null}
    </section>
  );
}
