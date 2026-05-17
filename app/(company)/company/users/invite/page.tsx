import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { InviteForm } from "@/components/company/InviteForm";
import { PendingInviteList } from "@/components/company/PendingInviteList";
import { getPendingInvitesData } from "@/lib/data/company";

export default async function CompanyInvitePage() {
  const session = await auth();
  const companyId = session?.user?.companyId;

  if (!companyId) {
    redirect("/login");
  }

  const pendingInvites = await getPendingInvitesData(companyId);

  return (
    <div className="mx-auto max-w-2xl space-y-2">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-semibold text-[#E6EDF3]">Invite a team member</h2>
        <p className="mt-2 text-sm text-[#8B949E]">
          They&apos;ll receive an email with a link to join your workspace.
        </p>
      </div>

      <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-8">
        <InviteForm />
      </div>

      <PendingInviteList invites={pendingInvites} />
    </div>
  );
}
