import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface WelcomeBannerProps {
  adminName: string;
  companyName: string;
  plan: string;
  seatUsed: number;
  seatLimit: number;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function WelcomeBanner({
  adminName,
  companyName,
  plan,
  seatUsed,
  seatLimit,
}: WelcomeBannerProps) {
  const firstName = adminName.split(" ")[0] ?? adminName;
  const usagePercent = seatLimit > 0 ? (seatUsed / seatLimit) * 100 : 0;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-6">
        <h2 className="text-2xl font-semibold tracking-tight text-[#E6EDF3]">
          {getGreeting()}, {firstName} 👋
        </h2>
        <p className="mt-2 text-sm text-[#8B949E]">
          <span className="font-medium text-[#C9D1D9]">{companyName}</span>
          {" · "}
          {planLabel} Plan
          {" · "}
          <span className="company-tabular">
            {seatUsed} seats used of {seatLimit}
          </span>
        </p>
      </div>

      {usagePercent > 80 ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-4 py-3 text-sm text-[#FBBF24]">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            You&apos;re using {seatUsed} of {seatLimit} seats.{" "}
            <Link href="/company/settings?tab=billing" className="font-medium underline">
              Upgrade →
            </Link>
          </p>
        </div>
      ) : null}
    </section>
  );
}
