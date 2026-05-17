import { z } from "zod";
import { ROLES } from "@/config/roles";

export const adminCreateCompanySchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  plan: z.enum(["free", "pro", "enterprise"]).default("free"),
  ownerEmail: z.string().email(),
});

export const adminUpdateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  plan: z.enum(["free", "pro", "enterprise"]).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const adminCompanyStatusSchema = z.object({
  isActive: z.boolean(),
});

export const adminChangeRoleSchema = z.object({
  role: z.enum([ROLES.SUPERADMIN, ROLES.COMPANY_ADMIN, ROLES.USER]),
});

export const adminFeatureFlagsSchema = z.object({
  featureFlags: z.record(z.string(), z.record(z.string(), z.boolean())),
});

export const adminChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});
