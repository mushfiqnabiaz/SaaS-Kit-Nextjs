import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ActivityTimeline } from "@/components/app/ActivityTimeline";
import { AnnouncementBoard } from "@/components/app/AnnouncementBoard";
import { TeammateGrid } from "@/components/app/TeammateGrid";
import { UserStatCard } from "@/components/app/UserStatCard";
import { WelcomeCard } from "@/components/app/WelcomeCard";
import { getUserDashboardData } from "@/lib/data/app";

export default async function AppDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const companyId = session?.user?.companyId ?? null;

  if (!userId) {
    redirect("/login");
  }

  const data = await getUserDashboardData(userId, companyId);
  const firstName = data.user.name.split(" ")[0] ?? data.user.name;

  return (
    <div className="space-y-10">
      <WelcomeCard
        firstName={firstName}
        roleLabel={data.roleLabel}
        lastLoginText={data.lastLoginText}
        avatarInitial={data.user.name.charAt(0).toUpperCase()}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <UserStatCard label="Member since" value={data.memberSince} />
        <UserStatCard
          label="Team size"
          value={`${data.teamSize} member${data.teamSize === 1 ? "" : "s"}`}
        />
        <UserStatCard
          label="Account status"
          value={data.isActive ? "Active" : "Inactive"}
          indicator={data.isActive ? "active" : "none"}
        />
      </div>

      <ActivityTimeline items={data.recentActivity} />

      <TeammateGrid
        teammates={data.teammates}
        totalCount={data.totalTeammates}
      />

      <AnnouncementBoard />
    </div>
  );
}
