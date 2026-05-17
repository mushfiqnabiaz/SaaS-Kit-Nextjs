# SaaS Boilerplate (Next.js)

Production-oriented multi-tenant SaaS starter built with **Next.js 14**, **Auth.js**, and a **dual-database** repository layer (MongoDB or PostgreSQL). It ships three role-based workspaces, tenant-scoped APIs, audit logging, invites, and **custom company roles with granular permissions**.

## Features

### Authentication & security
- Email/password login (Auth.js credentials)
- Optional Google OAuth
- JWT sessions with server-side session records
- Email verification for new company sign-ups (optional)
- Password reset, user invites, and verification emails via **SMTP** (or Resend fallback)
- Rate limiting on login, registration, and invites (Upstash Redis, optional)
- Middleware route protection and tenant resolution

### Multi-tenancy
- Companies (tenants) with plans (`free`, `pro`, `enterprise`)
- Seat limits per plan
- All company data scoped by `companyId`

### Role-based access control (RBAC)
- **Built-in roles:** `superadmin`, `company_admin`, `user`
- **Custom company roles:** company admins create tenant-scoped roles with assignable permissions
- Permission checks on every API route (`resource:action` keys)
- UI `RoleGuard` for client-side visibility (APIs remain authoritative)

### Dashboards
| Role | Base path | Purpose |
|------|-----------|---------|
| Superadmin | `/superadmin/*` | Platform-wide companies, users, audit logs, settings |
| Company admin | `/company/*` | Team, invites, custom roles, company settings, audit logs |
| User | `/app/*` | Personal dashboard, profile, team view, notifications |

### Company admin capabilities
- Team management and member role assignment
- Email invites with optional custom role
- **Roles & permissions** UI at `/company/roles`
- Company settings and audit log viewer

### Platform admin capabilities
- Company CRUD and activation
- User management and role changes
- Impersonation
- Feature flags / platform settings
- Platform analytics dashboard

### Developer experience
- Repository pattern with shared interfaces (`lib/db/interfaces.ts`)
- Switch databases via `DB_DRIVER=mongo|postgres`
- Zod validation on API inputs
- React Email templates
- Vitest unit tests and Playwright e2e scaffold

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Auth | Auth.js v5 (NextAuth) |
| Styling | Tailwind CSS, Radix UI |
| ORM (Postgres) | Drizzle |
| ODM (Mongo) | Mongoose |
| Email | Nodemailer (SMTP), Resend fallback, React Email |
| Charts | Recharts |
| Validation | Zod |

---

## Quick start

### Prerequisites
- Node.js 20+
- MongoDB **or** PostgreSQL
- (Optional) Upstash Redis for rate limiting
- (Optional) SMTP server or Resend API key for transactional email

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` — at minimum set:

```env
DB_DRIVER=mongo
MONGODB_URI=mongodb://localhost:27017/saas-boilerplate
AUTH_SECRET=your-secret-at-least-32-chars
NEXTAUTH_URL=http://localhost:3000
```

Generate a secret:

```bash
openssl rand -base64 32
```

### 3. Seed the database

```bash
npm run seed
```

This creates:
- A **superadmin** (`admin@example.com` by default)
- A **demo company** (`demo-company`)
- Demo users: `admin@demo.com`, `user1@demo.com`, `user2@demo.com`
- Default company roles: **Member**, **Team Lead**

Passwords come from `SEED_SUPERADMIN_PASSWORD` and `SEED_DEMO_PASSWORD` in `.env.local`.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_NAME` | No | Brand name on auth pages |
| `DB_DRIVER` | Yes | `mongo` or `postgres` |
| `MONGODB_URI` | If mongo | MongoDB connection string |
| `DATABASE_URL` | If postgres | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Auth.js session encryption |
| `NEXTAUTH_URL` | Yes | App URL (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth |
| `SMTP_HOST` | No* | SMTP server (e.g. Mailtrap, SendGrid, Gmail) |
| `SMTP_PORT` | No | SMTP port (default `587`) |
| `SMTP_SECURE` | No | `true` for TLS on port 465 |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASSWORD` | No | SMTP password |
| `EMAIL_FROM` | No | From address for all mail |
| `RESEND_API_KEY` | No | Fallback if `SMTP_HOST` is unset |
| `REQUIRE_EMAIL_VERIFICATION` | No | Block login until email verified (`true`/`false`) |
| `UPSTASH_REDIS_REST_URL` | No | Rate limit + tenant cache |
| `UPSTASH_REDIS_REST_TOKEN` | No | Rate limit + tenant cache |
| `SEED_SUPERADMIN_EMAIL` | No | Seed superadmin email |
| `SEED_SUPERADMIN_PASSWORD` | No | Seed superadmin password |
| `SEED_DEMO_PASSWORD` | No | Password for demo company users |

---

## Database setup

### MongoDB (default)

```env
DB_DRIVER=mongo
MONGODB_URI=mongodb://localhost:27017/saas-boilerplate
```

Collections are created automatically on first use. Run `npm run seed` after MongoDB is up.

### PostgreSQL

```env
DB_DRIVER=postgres
DATABASE_URL=postgresql://user:password@localhost:5432/saas_boilerplate
```

Apply the schema:

```bash
npm run db:push
# or
npm run db:generate && npm run db:migrate
```

Then seed:

```bash
npm run seed
```

The same repository interfaces work for both drivers; implementations live under `lib/db/mongo/` and `lib/db/postgres/`.

---

## Email (SMTP)

Transactional email is sent through a single `sendEmail()` helper (`lib/email/send.ts`). Provider selection:

1. **SMTP** — if `SMTP_HOST` is set (recommended for self-hosted and dev with [Mailtrap](https://mailtrap.io))
2. **Resend** — if `RESEND_API_KEY` is set and SMTP is not configured
3. **Console** — logs to the server console when neither is configured

### What sends email

| Flow | Trigger | Template |
|------|---------|----------|
| User invite | `POST /api/users/invite` | `InviteEmail` |
| Forgot password | `POST /api/auth/forgot-password` | `ForgotPasswordEmail` |
| Email verification | Company registration (`companyName` sign-up) | `VerifyEmail` |

Invited users and Google OAuth sign-ins are marked verified automatically; no verification email is sent for those paths.

### Example (Mailtrap)

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailtrap-user
SMTP_PASSWORD=your-mailtrap-password
EMAIL_FROM=noreply@yourdomain.com
REQUIRE_EMAIL_VERIFICATION=true
```

After registration with a new company, users are redirected to login with a “check your inbox” message. Verification links hit `GET /api/auth/verify-email?token=...`. Users can resend from the login page or `POST /api/auth/resend-verification`.

For PostgreSQL, run `npm run db:push` after pulling so `users.email_verified` and `email_verification_tokens` exist.

---

## How RBAC works

### Built-in roles (routing)
`user.role` determines which app shell you can access:

- `superadmin` → `/superadmin/*`
- `company_admin` → `/company/*`
- `user` → `/app/*`

Middleware enforces this in `middleware.ts` via `lib/middleware/routeProtection.ts`.

### Permissions (API access)
Permissions use keys like `users:create`, `audit_logs:read`, `roles:list`.

- **Superadmin** — all permissions
- **Company admin** — full company-scoped permissions including `roles:*`
- **User** — base permissions; can be extended via a **custom company role**

### Custom company roles
Company admins manage roles at **`/company/roles`**:

1. Create a role with a name and permission set (subset of `ASSIGNABLE_COMPANY_PERMISSIONS` in `config/roles.ts`)
2. Assign the role when inviting a user or from the team table
3. The user keeps `role: user` for routing but gains API permissions from `companyRoleId`

Permissions are resolved at request time in `lib/auth/resolvePermissions.ts` and attached to `SessionUser` in `requireApiUser()`.

---

## Project structure

```
app/
  (auth)/          # Login, register, password reset
  (superadmin)/    # Platform admin UI
  (company)/       # Company admin UI
  (app)/           # End-user workspace
  api/             # REST-style route handlers

components/
  superadmin/      # Platform dashboard components
  company/         # Company admin components (incl. roles UI)
  app/             # User workspace components
  shared/          # RoleGuard, shared UI

config/
  roles.ts         # Built-in permissions & assignable sets
  constants.ts     # Session TTL, invite expiry, etc.

lib/
  auth/            # Session, RBAC, invite tokens, permission resolution
  db/              # Repositories, factory, tenant scoping
  data/            # Server-side data loaders for pages
  middleware/      # Rate limit, route protection, tenant resolver
  audit/           # Audit log actions & writer
  company/         # Role permission helpers (client-safe + server)

models/
  mongo/           # Mongoose schemas
  postgres/        # Drizzle schema

scripts/
  seed.ts          # Idempotent database seed
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright e2e tests |
| `npm run seed` | Seed superadmin, demo company, roles, users |
| `npm run db:push` | Push Drizzle schema to Postgres |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run Drizzle migrations |

---

## API overview

### Auth
- `POST /api/auth/register` — Register (with optional invite token)
- `POST /api/auth/forgot-password` / `reset-password`
- `GET/DELETE /api/auth/sessions` — Session management

### Company (tenant-scoped)
- `GET/PATCH /api/companies/[id]`
- `GET/POST /api/users/invite` — List and send invites
- `GET/PATCH/DELETE /api/users/[id]`
- `GET/POST /api/company/roles` — Custom roles
- `PATCH/DELETE /api/company/roles/[id]`
- `GET /api/audit-logs`

### Platform admin
- `GET/POST /api/admin/companies`
- `GET/PATCH /api/admin/companies/[id]`
- `GET /api/admin/users`, `PATCH .../role`, impersonation routes
- `GET/PATCH /api/admin/settings`
- `GET /api/admin/stats`

All protected routes expect an authenticated session. Company-scoped actions verify `companyId` from the session matches the resource.

---

## Demo accounts

After `npm run seed` (defaults):

| Email | Role | Workspace |
|-------|------|-----------|
| `admin@example.com` | Superadmin | `/superadmin/dashboard` |
| `admin@demo.com` | Company admin | `/company/dashboard` |
| `user1@demo.com` | User (Team Lead role) | `/app/dashboard` |
| `user2@demo.com` | User (Member) | `/app/dashboard` |

Use passwords from `SEED_SUPERADMIN_PASSWORD` and `SEED_DEMO_PASSWORD`.

---

## Testing

```bash
npm run test        # Unit tests (RBAC, route protection, tenant scope)
npm run test:e2e    # Playwright (requires running app)
```

---

## Deployment

1. Set production env vars (`AUTH_SECRET`, `NEXTAUTH_URL`, database URL, email keys).
2. Run `npm run build` and `npm run start`, or deploy to Vercel/your host.
3. For Postgres, run migrations before first deploy.
4. Run `npm run seed` once on a fresh database (or manage users via your own process).

Ensure `NEXTAUTH_URL` matches your production domain. Configure Upstash Redis in production if you rely on rate limiting or tenant caching.

---

## License

Private / use per your project terms.
