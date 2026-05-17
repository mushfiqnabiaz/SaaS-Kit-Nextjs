import { ActivityFeed } from "@/components/superadmin/ActivityFeed";
import { GrowthChart } from "@/components/superadmin/GrowthChart";
import { PlanDonut } from "@/components/superadmin/PlanDonut";
import { StatCard } from "@/components/superadmin/StatCard";
import { TopCompaniesTable } from "@/components/superadmin/TopCompaniesTable";
import { getOverviewPageData } from "@/lib/data/superadmin";

export default async function SuperadminDashboardPage() {
  const data = await getOverviewPageData();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <StatCard key={kpi.label} data={kpi} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <GrowthChart data={data.growth} />
        </div>
        <div className="lg:col-span-2">
          <PlanDonut segments={data.planSegments} total={data.totalCompanies} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityFeed items={data.recentActivity} />
        <TopCompaniesTable rows={data.topCompanies} />
      </div>
    </div>
  );
}
