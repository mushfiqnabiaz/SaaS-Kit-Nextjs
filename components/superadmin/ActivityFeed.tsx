import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { ActivityItem } from "@/lib/data/superadmin";

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded border border-[#00D4FF]/20 bg-[#1A1A1E] p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9CA3AF]">
        Recent Activity
      </h2>
      {items.length === 0 ? (
        <p className="mt-6 text-center text-sm text-[#6B7280]">No recent activity</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.dotColor }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#E5E7EB]">{item.description}</p>
                <p className="mt-0.5 font-mono text-[10px] text-[#6B7280]">
                  {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/superadmin/audit-logs"
        className="mt-4 inline-block text-xs font-medium text-[#00D4FF] hover:underline"
      >
        View all logs →
      </Link>
    </section>
  );
}
