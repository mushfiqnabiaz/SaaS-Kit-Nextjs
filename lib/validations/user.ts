import { z } from "zod";
import { ROLES } from "@/config/roles";

const passwordRules = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const inviteUserSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum([ROLES.USER, ROLES.COMPANY_ADMIN]),
  companyRoleId: z.string().min(1).optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum([ROLES.USER, ROLES.COMPANY_ADMIN, ROLES.SUPERADMIN]).optional(),
  companyRoleId: z.string().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
  password: passwordRules.optional(),
  currentPassword: z.string().optional(),
});

/** Fields a company admin may set on another user (no email/password/superadmin). */
export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum([ROLES.USER, ROLES.COMPANY_ADMIN]).optional(),
  companyRoleId: z.string().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  password: passwordRules.optional(),
  currentPassword: z.string().min(1, "Current password is required when changing password"),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
