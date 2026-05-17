import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { KeyRound, LogIn, Shield, User } from "lucide-react";
import type { PersonalActivityItem } from "@/lib/data/app";

const icons = {
  login: LogIn,
  profile: User,
  security: Shield,
  default: KeyRound,
};

export function ActivityTimeline({ items }: { items: PersonalActivityItem[] }) {
  return (
    <section className="rounded-2xl border border-[#1E293B] bg-[#111827] p-6">
      <h2 className="text-lg font-semibold text-[#F1F5F9]">My recent activity</h2>
      {items.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[#64748B]">No activity recorded yet</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((item) => {
            const Icon = icons[item.icon];
            return (
              <li key={item.id} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#818CF8]/10 text-[#818CF8]">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm text-[#E2E8F0]">{item.action}</p>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Link
        href="/app/profile?tab=security"
        className="mt-5 inline-block text-sm font-medium text-[#818CF8] hover:underline"
      >
        View full history →
      </Link>
    </section>
  );
}
