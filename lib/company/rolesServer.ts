import type { CompanyRoleRecord } from "@/lib/db/interfaces";
import { getCompanyRoleRepository } from "@/lib/db/factory";

export async function assertCompanyRoleBelongsToCompany(
  roleId: string,
  companyId: string,
): Promise<CompanyRoleRecord | null> {
  const role = await getCompanyRoleRepository().findById(roleId);
  if (!role || role.companyId !== companyId) return null;
  return role;
}
