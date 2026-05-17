import { ConfigPermissionRepository } from "@/lib/db/ConfigPermissionRepository";
import type {
  IAuditRepository,
  ICompanyRepository,
  ICompanyRoleRepository,
  IInviteRepository,
  IEmailVerificationRepository,
  IPasswordResetRepository,
  IPermissionRepository,
  IPlatformSettingsRepository,
  ISessionRepository,
  IUserRepository,
} from "@/lib/db/interfaces";
import { MongoAuditRepository } from "@/lib/db/mongo/MongoAuditRepository";
import { MongoCompanyRepository } from "@/lib/db/mongo/MongoCompanyRepository";
import { MongoCompanyRoleRepository } from "@/lib/db/mongo/MongoCompanyRoleRepository";
import { MongoInviteRepository } from "@/lib/db/mongo/MongoInviteRepository";
import { MongoEmailVerificationRepository } from "@/lib/db/mongo/MongoEmailVerificationRepository";
import { MongoPasswordResetRepository } from "@/lib/db/mongo/MongoPasswordResetRepository";
import { MongoSessionRepository } from "@/lib/db/mongo/MongoSessionRepository";
import { MongoPlatformSettingsRepository } from "@/lib/db/mongo/MongoPlatformSettingsRepository";
import { MongoUserRepository } from "@/lib/db/mongo/MongoUserRepository";
import { PostgresAuditRepository } from "@/lib/db/postgres/PostgresAuditRepository";
import { PostgresCompanyRepository } from "@/lib/db/postgres/PostgresCompanyRepository";
import { PostgresCompanyRoleRepository } from "@/lib/db/postgres/PostgresCompanyRoleRepository";
import { PostgresInviteRepository } from "@/lib/db/postgres/PostgresInviteRepository";
import { PostgresEmailVerificationRepository } from "@/lib/db/postgres/PostgresEmailVerificationRepository";
import { PostgresPasswordResetRepository } from "@/lib/db/postgres/PostgresPasswordResetRepository";
import { PostgresSessionRepository } from "@/lib/db/postgres/PostgresSessionRepository";
import { PostgresPlatformSettingsRepository } from "@/lib/db/postgres/PostgresPlatformSettingsRepository";
import { PostgresUserRepository } from "@/lib/db/postgres/PostgresUserRepository";

type DbDriver = "mongo" | "postgres";

function getDriver(): DbDriver {
  const driver = process.env.DB_DRIVER;
  if (driver !== "mongo" && driver !== "postgres") {
    throw new Error(
      'DB_DRIVER must be set to "mongo" or "postgres". Example: DB_DRIVER=mongo',
    );
  }
  return driver;
}

let userRepository: IUserRepository | null = null;
let companyRepository: ICompanyRepository | null = null;
let auditRepository: IAuditRepository | null = null;
let inviteRepository: IInviteRepository | null = null;
let permissionRepository: IPermissionRepository | null = null;
let sessionRepository: ISessionRepository | null = null;
let passwordResetRepository: IPasswordResetRepository | null = null;
let emailVerificationRepository: IEmailVerificationRepository | null = null;
let platformSettingsRepository: IPlatformSettingsRepository | null = null;
let companyRoleRepository: ICompanyRoleRepository | null = null;

/** Clears memoized repository instances (for tests). */
export function resetDbFactories(): void {
  userRepository = null;
  companyRepository = null;
  auditRepository = null;
  inviteRepository = null;
  permissionRepository = null;
  sessionRepository = null;
  passwordResetRepository = null;
  emailVerificationRepository = null;
  platformSettingsRepository = null;
  companyRoleRepository = null;
}

export function getUserRepository(): IUserRepository {
  if (userRepository) return userRepository;

  const driver = getDriver();
  userRepository =
    driver === "mongo"
      ? MongoUserRepository.getInstance()
      : PostgresUserRepository.getInstance();
  return userRepository;
}

export function getCompanyRepository(): ICompanyRepository {
  if (companyRepository) return companyRepository;

  const driver = getDriver();
  companyRepository =
    driver === "mongo"
      ? MongoCompanyRepository.getInstance()
      : PostgresCompanyRepository.getInstance();
  return companyRepository;
}

export function getAuditRepository(): IAuditRepository {
  if (auditRepository) return auditRepository;

  const driver = getDriver();
  auditRepository =
    driver === "mongo"
      ? MongoAuditRepository.getInstance()
      : PostgresAuditRepository.getInstance();
  return auditRepository;
}

export function getInviteRepository(): IInviteRepository {
  if (inviteRepository) return inviteRepository;

  const driver = getDriver();
  inviteRepository =
    driver === "mongo"
      ? MongoInviteRepository.getInstance()
      : PostgresInviteRepository.getInstance();
  return inviteRepository;
}

export function getPermissionRepository(): IPermissionRepository {
  if (permissionRepository) return permissionRepository;
  permissionRepository = ConfigPermissionRepository.getInstance();
  return permissionRepository;
}

export function getSessionRepository(): ISessionRepository {
  if (sessionRepository) return sessionRepository;

  const driver = getDriver();
  sessionRepository =
    driver === "mongo"
      ? MongoSessionRepository.getInstance()
      : PostgresSessionRepository.getInstance();
  return sessionRepository;
}

export function getPlatformSettingsRepository(): IPlatformSettingsRepository {
  if (platformSettingsRepository) return platformSettingsRepository;

  const driver = getDriver();
  platformSettingsRepository =
    driver === "mongo"
      ? MongoPlatformSettingsRepository.getInstance()
      : PostgresPlatformSettingsRepository.getInstance();
  return platformSettingsRepository;
}

export function getEmailVerificationRepository(): IEmailVerificationRepository {
  if (emailVerificationRepository) return emailVerificationRepository;

  const driver = getDriver();
  emailVerificationRepository =
    driver === "mongo"
      ? MongoEmailVerificationRepository.getInstance()
      : PostgresEmailVerificationRepository.getInstance();
  return emailVerificationRepository;
}

export function getPasswordResetRepository(): IPasswordResetRepository {
  if (passwordResetRepository) return passwordResetRepository;

  const driver = getDriver();
  passwordResetRepository =
    driver === "mongo"
      ? MongoPasswordResetRepository.getInstance()
      : PostgresPasswordResetRepository.getInstance();
  return passwordResetRepository;
}

export function getCompanyRoleRepository(): ICompanyRoleRepository {
  if (companyRoleRepository) return companyRoleRepository;

  const driver = getDriver();
  companyRoleRepository =
    driver === "mongo"
      ? MongoCompanyRoleRepository.getInstance()
      : PostgresCompanyRoleRepository.getInstance();
  return companyRoleRepository;
}
