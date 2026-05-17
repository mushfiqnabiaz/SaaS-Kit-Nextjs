import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TeamPageClient } from "@/components/app/TeamPageClient";
import { Skeleton } from "@/components/ui/skeleton";
import { getTeamPageData } from "@/lib/data/app";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function TeamPage({ searchParams }: PageProps) {
  const session = await auth();
  const userId = session?.user?.id;
  const companyId = session?.user?.companyId;

  if (!userId || !companyId) {
    redirect("/login");
  }

  const sp = await searchParams;
  const data = await getTeamPageData(companyId, userId, sp.search);

  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl bg-[#111827]" />}>
      <TeamPageClient
        companyName={data.companyName}
        members={data.members}
        total={data.total}
        initialSearch={sp.search ?? ""}
      />
    </Suspense>
  );
}
