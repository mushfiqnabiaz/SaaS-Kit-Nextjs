import { ROLES, type PermissionKey, type Role } from "@/config/roles";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  companyId: string | null;
  companyRoleId: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  companyId?: string | null;
  companyRoleId?: string | null;
  emailVerified?: boolean;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  passwordHash?: string;
  role?: Role;
  companyId?: string | null;
  companyRoleId?: string | null;
  emailVerified?: boolean;
  isActive?: boolean;
}

export interface UserListFilters {
  companyId?: string;
  /** Superadmin-only: allow listing users across all tenants */
  allowUnscoped?: boolean;
  role?: Role;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserCountFilters {
  companyId?: string;
  isActive?: boolean;
  createdAfter?: Date;
}

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  create(data: CreateUserDTO): Promise<UserRecord>;
  update(id: string, data: UpdateUserDTO): Promise<UserRecord | null>;
  list(filters?: UserListFilters): Promise<{ users: UserRecord[]; total: number }>;
  count(filters?: UserCountFilters): Promise<number>;
  softDelete(id: string): Promise<UserRecord | null>;
}

export interface CompanyRecord {
  id: string;
  name: string;
  slug: string;
  plan: string;
  ownerId: string;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompanyDTO {
  name: string;
  slug: string;
  plan?: string;
  ownerId: string;
  settings?: Record<string, unknown>;
}

export interface UpdateCompanyDTO {
  name?: string;
  slug?: string;
  plan?: string;
  ownerId?: string;
  settings?: Record<string, unknown>;
  isActive?: boolean;
}

export interface CompanyListFilters {
  isActive?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface CompanyCountFilters {
  isActive?: boolean;
}

export interface ICompanyRepository {
  findById(id: string): Promise<CompanyRecord | null>;
  findBySlug(slug: string): Promise<CompanyRecord | null>;
  create(data: CreateCompanyDTO): Promise<CompanyRecord>;
  update(id: string, data: UpdateCompanyDTO): Promise<CompanyRecord | null>;
  list(filters?: CompanyListFilters): Promise<{ companies: CompanyRecord[]; total: number }>;
  count(filters?: CompanyCountFilters): Promise<number>;
  softDelete(id: string): Promise<CompanyRecord | null>;
}

export type PlanFeatureFlags = Record<string, boolean>;

export type PlatformFeatureFlags = Record<string, PlanFeatureFlags>;

export interface PlatformSettingsRecord {
  id: string;
  featureFlags: PlatformFeatureFlags;
  updatedAt: Date;
}

export interface IPlatformSettingsRepository {
  get(): Promise<PlatformSettingsRecord>;
  updateFeatureFlags(flags: PlatformFeatureFlags): Promise<PlatformSettingsRecord>;
}

export interface InviteRecord {
  id: string;
  email: string;
  companyId: string;
  role: Role;
  companyRoleId: string | null;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type InviteRole = typeof ROLES.USER | typeof ROLES.COMPANY_ADMIN;

export interface CreateInviteDTO {
  email: string;
  companyId: string;
  role: InviteRole;
  companyRoleId?: string | null;
  token: string;
  expiresAt: Date;
}

export interface CompanyRoleRecord {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: PermissionKey[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompanyRoleDTO {
  companyId: string;
  name: string;
  slug: string;
  description?: string | null;
  permissions: PermissionKey[];
  isSystem?: boolean;
}

export interface UpdateCompanyRoleDTO {
  name?: string;
  slug?: string;
  description?: string | null;
  permissions?: PermissionKey[];
}

export interface ICompanyRoleRepository {
  create(data: CreateCompanyRoleDTO): Promise<CompanyRoleRecord>;
  findById(id: string): Promise<CompanyRoleRecord | null>;
  findBySlug(companyId: string, slug: string): Promise<CompanyRoleRecord | null>;
  list(companyId: string): Promise<CompanyRoleRecord[]>;
  update(id: string, data: UpdateCompanyRoleDTO): Promise<CompanyRoleRecord | null>;
  delete(id: string): Promise<boolean>;
  countUsersWithRole(roleId: string): Promise<number>;
}

export interface IInviteRepository {
  create(data: CreateInviteDTO): Promise<InviteRecord>;
  findByToken(token: string): Promise<InviteRecord | null>;
  findById(id: string): Promise<InviteRecord | null>;
  findPendingByEmail(email: string, companyId: string): Promise<InviteRecord | null>;
  listPending(companyId: string): Promise<InviteRecord[]>;
  updateToken(id: string, token: string): Promise<InviteRecord | null>;
  markUsed(id: string): Promise<InviteRecord | null>;
  delete(id: string): Promise<boolean>;
}

export type PermissionAction = "create" | "read" | "update" | "delete" | "list";

export type PermissionResource =
  | "users"
  | "companies"
  | "audit_logs"
  | "billing"
  | "workspace"
  | "roles";

export interface PermissionRecord {
  id: string;
  role: Role;
  resource: PermissionResource;
  action: PermissionAction;
}

export interface IPermissionRepository {
  findByRole(role: Role): Promise<PermissionRecord[]>;
  hasPermission(
    role: Role,
    resource: PermissionResource,
    action: PermissionAction,
  ): Promise<boolean>;
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorRole: Role;
  action: string;
  resource: string;
  resourceId: string | null;
  companyId: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface CreateAuditLogDTO {
  actorId: string;
  actorRole: Role;
  action: string;
  resource: string;
  resourceId?: string | null;
  companyId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuditLogListFilters {
  companyId?: string;
  actorId?: string;
  actorRole?: Role;
  action?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface IAuditRepository {
  create(data: CreateAuditLogDTO): Promise<AuditLogRecord>;
  list(filters?: AuditLogListFilters): Promise<{ logs: AuditLogRecord[]; total: number }>;
}

export interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: Date;
  deviceInfo: string | null;
  createdAt: Date;
}

export interface CreateSessionDTO {
  userId: string;
  token: string;
  expiresAt: Date;
  deviceInfo?: string | null;
}

export interface ISessionRepository {
  create(data: CreateSessionDTO): Promise<SessionRecord>;
  findById(id: string): Promise<SessionRecord | null>;
  findByToken(token: string): Promise<SessionRecord | null>;
  listByUserId(userId: string): Promise<SessionRecord[]>;
  deleteById(id: string): Promise<boolean>;
  deleteAllByUserId(userId: string): Promise<number>;
}

export interface PasswordResetRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IPasswordResetRepository {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<PasswordResetRecord>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetRecord | null>;
  deleteByUserId(userId: string): Promise<number>;
  deleteById(id: string): Promise<boolean>;
}

export interface EmailVerificationRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IEmailVerificationRepository {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<EmailVerificationRecord>;
  findByTokenHash(tokenHash: string): Promise<EmailVerificationRecord | null>;
  deleteByUserId(userId: string): Promise<number>;
  deleteById(id: string): Promise<boolean>;
}
