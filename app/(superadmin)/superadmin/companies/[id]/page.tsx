import { CompanyDetailClient } from "@/components/superadmin/CompanyDetailClient";

interface PageProps {
  params: { id: string };
}

export default function SuperadminCompanyDetailPage({ params }: PageProps) {
  return <CompanyDetailClient companyId={params.id} />;
}
