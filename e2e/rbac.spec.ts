import { expect, test } from "@playwright/test";

const superadminEmail = process.env.E2E_SUPERADMIN_EMAIL ?? "admin@example.com";
const superadminPassword = process.env.E2E_SUPERADMIN_PASSWORD ?? "change-me-secure-password";
const companyAdminEmail = process.env.E2E_COMPANY_ADMIN_EMAIL ?? "admin@demo.com";
const companyAdminPassword = process.env.E2E_DEMO_PASSWORD ?? "demo-password-change-me";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test.describe("RBAC and superadmin panel", () => {
  test("superadmin can log in and see dashboard", async ({ page }) => {
    await login(page, superadminEmail, superadminPassword);
    await expect(page).toHaveURL(/\/superadmin\/dashboard/);
    await expect(page.getByRole("heading", { name: /overview/i })).toBeVisible();
  });

  test("superadmin can open companies page", async ({ page }) => {
    await login(page, superadminEmail, superadminPassword);
    await page.goto("/superadmin/companies");
    await expect(page.getByRole("heading", { name: /companies/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /create company/i })).toBeVisible();
  });

  test("company_admin cannot access superadmin routes", async ({ page }) => {
    await login(page, companyAdminEmail, companyAdminPassword);
    await page.goto("/superadmin/dashboard");
    await expect(page).not.toHaveURL(/\/superadmin\/dashboard/);
  });

  test("company_admin can access company panel", async ({ page }) => {
    await login(page, companyAdminEmail, companyAdminPassword);
    await expect(page).toHaveURL(/\/company\/dashboard/);
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  });

  test("regular user cannot access company routes", async ({ page }) => {
    const userEmail = process.env.E2E_USER_EMAIL ?? "user1@demo.com";
    await login(page, userEmail, companyAdminPassword);
    await page.goto("/company/users");
    await expect(page).not.toHaveURL(/\/company\/users/);
  });
});
