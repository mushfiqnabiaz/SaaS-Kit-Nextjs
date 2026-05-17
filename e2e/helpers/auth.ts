import { expect, type Page } from "@playwright/test";

export const CREDENTIALS = {
  superadmin: {
    email: process.env.E2E_SUPERADMIN_EMAIL ?? "admin@example.com",
    password: process.env.E2E_SUPERADMIN_PASSWORD ?? "change-me-secure-password",
    dashboard: /\/superadmin\/dashboard/,
  },
  companyAdmin: {
    email: process.env.E2E_COMPANY_ADMIN_EMAIL ?? "admin@demo.com",
    password: process.env.E2E_DEMO_PASSWORD ?? "demo-password-change-me",
    dashboard: /\/company\/dashboard/,
  },
  user: {
    email: process.env.E2E_USER_EMAIL ?? "user1@demo.com",
    password: process.env.E2E_DEMO_PASSWORD ?? "demo-password-change-me",
    dashboard: /\/app\/dashboard/,
  },
} as const;

export type AuthRole = keyof typeof CREDENTIALS;

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 });
}

export async function loginAs(page: Page, role: AuthRole): Promise<void> {
  const creds = CREDENTIALS[role];
  await login(page, creds.email, creds.password);
  await expect(page).toHaveURL(creds.dashboard, { timeout: 20_000 });
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
}
