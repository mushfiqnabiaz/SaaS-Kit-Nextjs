import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { ActivityItem } from "@/lib/data/company";

export function CompanyActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-xl border border-[#30363D] bg-[#161B22] p-5">
      <h2 className="text-sm font-semibold text-[#E6EDF3]">Recent Activity</h2>
      {items.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[#6E7681]">No activity yet</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.dotColor }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#C9D1D9]">{item.description}</p>
                <p className="mt-0.5 text-[11px] text-[#6E7681]">
                  {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/company/audit-logs"
        className="mt-4 inline-block text-xs font-medium text-[#6366F1] hover:underline"
      >
        View all logs →
      </Link>
    </section>
  );
}
