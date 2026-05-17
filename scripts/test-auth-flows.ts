/**
 * Full auth flow smoke tests against a running dev server.
 * Run: npx tsx scripts/test-auth-flows.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PASSWORD_RESET_TOKEN_EXPIRY_HOURS } from "../config/constants";
import { generateSecureToken, hashToken } from "../lib/auth/tokens";
import {
  getPasswordResetRepository,
  getUserRepository,
} from "../lib/db/factory";

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

loadEnvLocal();

const BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const SUPERADMIN_EMAIL = process.env.SEED_SUPERADMIN_EMAIL ?? "admin@example.com";
const SUPERADMIN_PASSWORD =
  process.env.SEED_SUPERADMIN_PASSWORD ?? "change-me-secure-password";
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "demo-password-change-me";

type Result = { name: string; pass: boolean; detail?: string };

const results: Result[] = [];

function record(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  const icon = pass ? "✓" : "✗";
  console.log(`${icon} ${name}${detail ? ` — ${detail}` : ""}`);
}

function collectSetCookies(res: Response): string[] {
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie();
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function mergeCookies(existing: string, setCookie: string[] | undefined): string {
  const jar: string[] = [];
  const seen = new Set<string>();

  const addPair = (pair: string) => {
    const name = pair.split("=")[0]?.trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    jar.push(pair);
  };

  for (const part of existing.split(";").map((c) => c.trim()).filter(Boolean)) {
    addPair(part);
  }
  for (const raw of setCookie ?? []) {
    const pair = raw.split(";")[0]?.trim();
    if (pair) addPair(pair);
  }
  return jar.join("; ");
}

async function jsonFetch(
  path: string,
  init?: RequestInit & { cookies?: string; noRedirect?: boolean },
): Promise<{ status: number; json: unknown; cookies: string }> {
  const headers = new Headers(init?.headers);
  if (init?.cookies) headers.set("Cookie", init.cookies);
  const { noRedirect, cookies: _c, ...fetchInit } = init ?? {};
  const res = await fetch(`${BASE}${path}`, {
    ...fetchInit,
    headers,
    redirect: noRedirect ? "manual" : fetchInit.redirect,
  });
  const cookies = mergeCookies(init?.cookies ?? "", collectSetCookies(res));
  let json: unknown = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json, cookies };
}

async function credentialsSignIn(
  email: string,
  password: string,
): Promise<{ ok: boolean; cookies: string; session: unknown }> {
  const csrf = await jsonFetch("/api/auth/csrf");
  const csrfToken = (csrf.json as { csrfToken?: string }).csrfToken;
  if (!csrfToken) {
    return { ok: false, cookies: csrf.cookies, session: null };
  }

  const signIn = await jsonFetch("/api/auth/callback/credentials", {
    method: "POST",
    noRedirect: true,
    cookies: csrf.cookies,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${BASE}/`,
      json: "true",
    }).toString(),
  });

  const sessionRes = await jsonFetch("/api/auth/session", {
    cookies: signIn.cookies,
  });
  const session = sessionRes.json as { user?: { email?: string } } | null;
  const ok = Boolean(session?.user?.email);
  return { ok, cookies: signIn.cookies, session, signInStatus: signIn.status };
}

async function main() {
  console.log(`\nAuth flow tests → ${BASE}\n`);

  // ── Page availability ─────────────────────────────────────────────
  for (const path of ["/login", "/register", "/forgot-password", "/reset-password"]) {
    const res = await fetch(`${BASE}${path}`);
    record(`GET ${path}`, res.status === 200, `status ${res.status}`);
  }

  // ── Credentials: invalid login ────────────────────────────────────
  const badLogin = await credentialsSignIn("nobody@example.com", "wrong-password-xyz");
  record("Credentials: invalid login rejected", !badLogin.ok);

  // ── Credentials: role logins ───────────────────────────────────────
  const superLogin = await credentialsSignIn(SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
  record(
    "Credentials: superadmin login",
    superLogin.ok,
    superLogin.ok
      ? (superLogin.session as { user?: { role?: string } }).user?.role
      : "failed — check SEED_SUPERADMIN_PASSWORD",
  );

  const adminLogin = await credentialsSignIn("admin@demo.com", DEMO_PASSWORD);
  record(
    "Credentials: company_admin login",
    adminLogin.ok,
    adminLogin.ok ? "admin@demo.com" : "failed — run seed with SEED_DEMO_PASSWORD",
  );

  const userLogin = await credentialsSignIn("user1@demo.com", DEMO_PASSWORD);
  record(
    "Credentials: user login",
    userLogin.ok,
    userLogin.ok ? "user1@demo.com" : "failed — run seed",
  );

  // ── Session API ───────────────────────────────────────────────────
  const anonSession = await jsonFetch("/api/auth/session");
  record(
    "Session: anonymous returns empty user",
    !(anonSession.json as { user?: unknown })?.user,
  );

  if (adminLogin.ok) {
    const authedSession = await jsonFetch("/api/auth/session", {
      cookies: adminLogin.cookies,
    });
    const user = (authedSession.json as { user?: { email?: string; role?: string } })
      .user;
    record(
      "Session: authenticated returns user",
      user?.email === "admin@demo.com" && user?.role === "company_admin",
      user?.role,
    );
  }

  // ── Registration guards ───────────────────────────────────────────
  const regBlocked = await jsonFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test User",
      email: `blocked-${Date.now()}@test.local`,
      password: "TestPass1",
    }),
  });
  record(
    "Register: blocked without invite/company",
    regBlocked.status === 403,
    `status ${regBlocked.status}`,
  );

  const regInvalid = await jsonFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "x", email: "not-an-email", password: "short" }),
  });
  record("Register: validation errors", regInvalid.status === 400);

  // ── Forgot password ───────────────────────────────────────────────
  const forgotBad = await jsonFetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-valid" }),
  });
  record("Forgot password: invalid email", forgotBad.status === 400);

  const forgotOk = await jsonFetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@demo.com" }),
  });
  record("Forgot password: known user", forgotOk.status === 200);

  const forgotUnknown = await jsonFetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `ghost-${Date.now()}@test.local` }),
  });
  record(
    "Forgot password: unknown email still 200 (no leak)",
    forgotUnknown.status === 200,
  );

  // ── Reset password (DB-seeded token) ──────────────────────────────
  process.env.DB_DRIVER ??= "mongo";
  const userRepo = getUserRepository();
  const testUser = await userRepo.findByEmail("user2@demo.com");
  if (testUser) {
    const rawToken = generateSecureToken();
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );
    await getPasswordResetRepository().create(
      testUser.id,
      hashToken(rawToken),
      expiresAt,
    );

    const resetBad = await jsonFetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid-token", password: "NewPass1" }),
    });
    record("Reset password: invalid token", resetBad.status === 400);

    const newPassword = `ResetTest${Date.now().toString().slice(-4)}!`;
    const resetOk = await jsonFetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: rawToken, password: newPassword }),
    });
    record("Reset password: valid token", resetOk.status === 200);

    const loginAfterReset = await credentialsSignIn("user2@demo.com", newPassword);
    record("Reset password: login with new password", loginAfterReset.ok);

    // Restore demo password for e2e / manual testing
    const bcrypt = await import("bcryptjs");
    const { BCRYPT_ROUNDS } = await import("../config/constants");
    const restoredHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
    await userRepo.update(testUser.id, { passwordHash: restoredHash });
    await getPasswordResetRepository().deleteByUserId(testUser.id);
  } else {
    record("Reset password: skipped (user2@demo.com missing)", false, "run npm run seed");
  }

  // ── Email verification ──────────────────────────────────────────────
  const resend = await jsonFetch("/api/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@demo.com" }),
  });
  // Verified users get 200 without sending; unverified + SMTP failure returns 503
  record(
    "Resend verification: endpoint",
    resend.status === 200 || resend.status === 503,
    `status ${resend.status}`,
  );

  const verifyMissing = await fetch(
    `${BASE}/api/auth/verify-email`,
    { redirect: "manual" },
  );
  record(
    "Verify email: missing token redirects",
    verifyMissing.status === 307 || verifyMissing.status === 302,
    `status ${verifyMissing.status}`,
  );

  const verifyInvalid = await fetch(
    `${BASE}/api/auth/verify-email?token=invalid-token-xyz`,
    { redirect: "manual" },
  );
  const invalidLoc = verifyInvalid.headers.get("location") ?? "";
  record(
    "Verify email: invalid token redirects with error",
    invalidLoc.includes("invalid_verification"),
    invalidLoc,
  );

  // ── Invite accept GET ───────────────────────────────────────────────
  const inviteNoToken = await fetch(`${BASE}/api/users/invite/accept`, {
    redirect: "manual",
  });
  const inviteLoc = inviteNoToken.headers.get("location") ?? "";
  record(
    "Invite accept GET: no token → register",
    inviteLoc.includes("/register"),
    inviteLoc,
  );

  const inviteBad = await fetch(
    `${BASE}/api/users/invite/accept?token=not-a-valid-jwt`,
    { redirect: "manual" },
  );
  const badInviteLoc = inviteBad.headers.get("location") ?? "";
  record(
    "Invite accept GET: invalid token → login error",
    badInviteLoc.includes("invalid_invite"),
    badInviteLoc,
  );

  // ── Invite API (authenticated) ──────────────────────────────────────
  if (adminLogin.ok) {
    const inviteEmail = `invite-test-${Date.now()}@test.local`;
    const createInvite = await jsonFetch("/api/users/invite", {
      method: "POST",
      cookies: adminLogin.cookies,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: "user" }),
    });
    record(
      "Invite: company_admin can create",
      createInvite.status === 200 ||
        createInvite.status === 201 ||
        createInvite.status === 503,
      `status ${createInvite.status}${createInvite.status === 503 ? " (SMTP failed)" : ""}`,
    );

    const listInvites = await jsonFetch("/api/users/invite", {
      cookies: adminLogin.cookies,
    });
    const invites = (listInvites.json as { data?: unknown[] })?.data;
    record(
      "Invite: list pending",
      listInvites.status === 200 && Array.isArray(invites),
      `count ${Array.isArray(invites) ? invites.length : "?"}`,
    );

    const acceptUnauth = await jsonFetch("/api/users/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "fake" }),
    });
    record("Invite accept POST: requires auth", acceptUnauth.status === 401);
  } else {
    record("Invite: create/list (skipped)", false, "admin login failed");
    record("Invite accept POST: requires auth (skipped)", false, "admin login failed");
  }

  // ── Protected route without session ─────────────────────────────────
  const protectedApi = await jsonFetch("/api/users");
  record("API: /api/users requires auth", protectedApi.status === 401);

  // ── Google OAuth config ─────────────────────────────────────────────
  const providers = await jsonFetch("/api/auth/providers");
  const providerIds = Object.keys(
    (providers.json as Record<string, unknown>) ?? {},
  );
  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  record(
    "OAuth: Google provider",
    googleConfigured ? providerIds.includes("google") : !providerIds.includes("google"),
    googleConfigured ? "configured" : "not configured (expected disabled)",
  );
  record("OAuth: Credentials provider", providerIds.includes("credentials"));

  // ── Summary ─────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed}/${results.length} passed`);
  if (failed.length) {
    console.log("\nFailed:");
    for (const f of failed) console.log(`  • ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
    process.exit(1);
  }
  console.log("\nAll auth flow tests passed.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
