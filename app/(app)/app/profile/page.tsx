import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileCard } from "@/components/app/ProfileCard";
import { ProfileTabs } from "@/components/app/ProfileTabs";
import { getUserProfileData } from "@/lib/data/app";

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const companyId = session?.user?.companyId ?? null;

  if (!userId) {
    redirect("/login");
  }

  const data = await getUserProfileData(userId, companyId);

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <ProfileCard
        name={data.user.name}
        email={data.user.email}
        role={data.user.role}
        companyName={data.companyName}
        memberSince={data.memberSince}
      />
      <ProfileTabs userId={data.user.id} defaultName={data.user.name} email={data.user.email} />
    </div>
  );
}
