import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SettingsTabs } from "@/components/company/SettingsTabs";
import {
  getCompanyRepository,
  getInviteRepository,
  getUserRepository,
} from "@/lib/db/factory";

export default async function CompanySettingsPage() {
  const session = await auth();
  const companyId = session?.user?.companyId;

  if (!companyId) {
    redirect("/login");
  }

  const [company, totalUsers, pendingInvites] = await Promise.all([
    getCompanyRepository().findById(companyId),
    getUserRepository().count({ companyId }),
    getInviteRepository().listPending(companyId),
  ]);

  if (!company) {
    redirect("/login");
  }

  const seatUsed = totalUsers + pendingInvites.length;

  return (
    <SettingsTabs
      company={{
        id: company.id,
        name: company.name,
        slug: company.slug,
        plan: company.plan,
        settings: company.settings,
      }}
      seatUsed={seatUsed}
    />
  );
}
