/**
 * Idempotent database seed. Run: npx tsx scripts/seed.ts
 * Requires DB_DRIVER and the matching connection env (MONGODB_URI or DATABASE_URL).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "../config/constants";
import {
  DEFAULT_MEMBER_PERMISSIONS,
  DEFAULT_TEAM_LEAD_PERMISSIONS,
  ROLES,
} from "../config/roles";

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = value;
  }
}

const DEMO_COMPANY_SLUG = "demo-company";

async function ensureDefaultCompanyRoles(companyId: string): Promise<void> {
  const { getCompanyRoleRepository } = await import("../lib/db/factory");
  const roleRepo = getCompanyRoleRepository();

  const defaults = [
    {
      name: "Member",
      slug: "member",
      description: "Standard workspace access",
      permissions: DEFAULT_MEMBER_PERMISSIONS,
    },
    {
      name: "Team Lead",
      slug: "team-lead",
      description: "Can invite and manage team members",
      permissions: DEFAULT_TEAM_LEAD_PERMISSIONS,
    },
  ] as const;

  for (const entry of defaults) {
    const existing = await roleRepo.findBySlug(companyId, entry.slug);
    if (existing) {
      console.log(`  Role already exists: ${entry.slug}`);
      continue;
    }
    await roleRepo.create({
      companyId,
      name: entry.name,
      slug: entry.slug,
      description: entry.description,
      permissions: [...entry.permissions],
      isSystem: true,
    });
    console.log(`  Created role: ${entry.name}`);
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  const { getCompanyRepository, getCompanyRoleRepository, getUserRepository } =
    await import("../lib/db/factory");

  const superadminEmail = process.env.SEED_SUPERADMIN_EMAIL ?? "admin@example.com";
  const superadminPassword = process.env.SEED_SUPERADMIN_PASSWORD ?? "change-me-secure-password";

  const userRepo = getUserRepository();
  const companyRepo = getCompanyRepository();
  const roleRepo = getCompanyRoleRepository();

  let superadmin = await userRepo.findByEmail(superadminEmail);
  if (!superadmin) {
    const passwordHash = await bcrypt.hash(superadminPassword, BCRYPT_ROUNDS);
    superadmin = await userRepo.create({
      name: "Super Admin",
      email: superadminEmail,
      passwordHash,
      role: ROLES.SUPERADMIN,
      companyId: null,
    });
    console.log(`Created superadmin: ${superadminEmail}`);
  } else {
    console.log(`Superadmin already exists: ${superadminEmail}`);
  }

  let demoCompany = await companyRepo.findBySlug(DEMO_COMPANY_SLUG);
  if (!demoCompany) {
    demoCompany = await companyRepo.create({
      name: "Demo Company",
      slug: DEMO_COMPANY_SLUG,
      plan: "pro",
      ownerId: superadmin.id,
    });
    console.log(`Created demo company: ${DEMO_COMPANY_SLUG}`);
  } else {
    console.log(`Demo company already exists: ${DEMO_COMPANY_SLUG}`);
  }

  console.log("Ensuring default company roles...");
  await ensureDefaultCompanyRoles(demoCompany.id);

  const teamLeadRole = await roleRepo.findBySlug(demoCompany.id, "team-lead");

  const seedUsers = [
    {
      email: "admin@demo.com",
      name: "Demo Admin",
      role: ROLES.COMPANY_ADMIN,
      companyRoleId: null as string | null,
    },
    {
      email: "user1@demo.com",
      name: "Demo User One",
      role: ROLES.USER,
      companyRoleId: teamLeadRole?.id ?? null,
    },
    {
      email: "user2@demo.com",
      name: "Demo User Two",
      role: ROLES.USER,
      companyRoleId: null as string | null,
    },
  ] as const;

  const demoPassword = process.env.SEED_DEMO_PASSWORD ?? "demo-password-change-me";

  for (const entry of seedUsers) {
    const existing = await userRepo.findByEmail(entry.email);
    if (existing) {
      console.log(`User already exists: ${entry.email}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(demoPassword, BCRYPT_ROUNDS);
    await userRepo.create({
      name: entry.name,
      email: entry.email,
      passwordHash,
      role: entry.role,
      companyId: demoCompany.id,
      companyRoleId: entry.companyRoleId,
    });
    console.log(`Created user: ${entry.email} (${entry.role})`);
  }

  console.log("\nSeed complete.");
  console.log(`  Superadmin: ${superadminEmail}`);
  console.log(`  Demo company slug: ${DEMO_COMPANY_SLUG}`);
  console.log(`  Demo users password: (from SEED_DEMO_PASSWORD or default)`);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
