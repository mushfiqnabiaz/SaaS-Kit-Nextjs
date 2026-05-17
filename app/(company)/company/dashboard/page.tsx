import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ActivityChart } from "@/components/company/ActivityChart";
import { CompanyActivityFeed } from "@/components/company/CompanyActivityFeed";
import { RecentMembersTable } from "@/components/company/RecentMembersTable";
import { RoleDonut } from "@/components/company/RoleDonut";
import { StatCard } from "@/components/company/StatCard";
import { WelcomeBanner } from "@/components/company/WelcomeBanner";
import { getCompanyDashboardData } from "@/lib/data/company";

export default async function CompanyDashboardPage() {
  const session = await auth();
  const companyId = session?.user?.companyId;

  if (!companyId) {
    redirect("/login");
  }

  const data = await getCompanyDashboardData(companyId, session?.user?.name ?? "Admin");
  const headcount = data.roleSegments.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="space-y-8">
      <WelcomeBanner
        adminName={data.adminName}
        companyName={data.company.name}
        plan={data.company.plan}
        seatUsed={data.seatUsed}
        seatLimit={data.seatLimit}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <StatCard key={kpi.label} data={kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ActivityChart data={data.activity} />
        </div>
        <div className="lg:col-span-2">
          <RoleDonut segments={data.roleSegments} total={headcount} />
        </div>
      </div>

      <RecentMembersTable rows={data.recentMembers} />

      <CompanyActivityFeed items={data.recentActivity} />
    </div>
  );
}
