import { z } from "zod";
import { isValidAssignablePermission } from "@/config/roles";

const permissionKeySchema = z
  .string()
  .refine((key) => isValidAssignablePermission(key), "Invalid permission");

export const createCompanyRoleSchema = z.object({
  name: z.string().min(2).max(64),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens")
    .optional(),
  description: z.string().max(256).optional().nullable(),
  permissions: z.array(permissionKeySchema).min(1, "Select at least one permission"),
});

export const updateCompanyRoleSchema = z.object({
  name: z.string().min(2).max(64).optional(),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(256).optional().nullable(),
  permissions: z.array(permissionKeySchema).min(1).optional(),
});

export type CreateCompanyRoleInput = z.infer<typeof createCompanyRoleSchema>;
export type UpdateCompanyRoleInput = z.infer<typeof updateCompanyRoleSchema>;
