import { ROLES, type Role } from "@/config/roles";
import { CompanyRoleBadge } from "@/components/company/CompanyRoleBadge";
import { CustomRoleBadge } from "@/components/company/CustomRoleBadge";

export function MemberRoleLabel({
  role,
  companyRoleName,
}: {
  role: Role;
  companyRoleName?: string | null;
}) {
  if (role === ROLES.COMPANY_ADMIN) {
    return <CompanyRoleBadge role={role} />;
  }

  if (companyRoleName) {
    return <CustomRoleBadge name={companyRoleName} />;
  }

  return <CompanyRoleBadge role={role} />;
}
