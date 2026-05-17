import Link from "next/link";
import { PLAN_DISPLAY } from "@/lib/plans/seats";

interface PlanCardProps {
  plan: string;
  seatUsed: number;
  seatLimit: number;
  renewalDate?: string;
}

export function PlanCard({ plan, seatUsed, seatLimit, renewalDate }: PlanCardProps) {
  const info = PLAN_DISPLAY[plan] ?? { label: plan, price: "—" };

  return (
    <article className="rounded-xl border border-[#6366F1]/30 bg-gradient-to-br from-[#6366F1]/10 to-transparent p-6">
      <p className="text-xs uppercase tracking-wider text-[#818CF8]">Current plan</p>
      <h3 className="mt-2 text-2xl font-semibold text-[#E6EDF3]">{info.label}</h3>
      <p className="mt-1 text-sm text-[#8B949E]">{info.price}</p>
      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-[#6E7681]">Seats used</dt>
          <dd className="company-tabular font-medium text-[#C9D1D9]">
            {seatUsed} / {seatLimit}
          </dd>
        </div>
        {renewalDate ? (
          <div className="flex justify-between">
            <dt className="text-[#6E7681]">Renews</dt>
            <dd className="text-[#C9D1D9]">{renewalDate}</dd>
          </div>
        ) : null}
      </dl>
      {plan !== "enterprise" ? (
        <Link
          href="/billing"
          className="mt-6 inline-flex rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#6366F1]/90"
        >
          Upgrade plan
        </Link>
      ) : null}
    </article>
  );
}
