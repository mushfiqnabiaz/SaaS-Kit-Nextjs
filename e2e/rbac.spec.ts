import { expect, test } from "@playwright/test";

test.describe("RBAC — superadmin", () => {
  test.use({ storageState: "e2e/.auth/superadmin.json" });

  test("can view dashboard and companies", async ({ page }) => {
    await page.goto("/superadmin/dashboard");
    await expect(page.getByRole("heading", { name: /overview/i })).toBeVisible();

    await page.goto("/superadmin/companies");
    await expect(
      page.getByRole("heading", { name: /^companies$/i, level: 1 }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /new company/i })).toBeVisible();
  });
});

test.describe("RBAC — company admin", () => {
  test.use({ storageState: "e2e/.auth/companyAdmin.json" });

  test("cannot access superadmin routes", async ({ page }) => {
    await page.goto("/superadmin/dashboard");
    await expect(page).not.toHaveURL(/\/superadmin\/dashboard/);
  });

  test("can access company panel", async ({ page }) => {
    await page.goto("/company/dashboard");
    await expect(page.getByRole("heading", { name: /dashboard/i, level: 1 })).toBeVisible();
  });
});

test.describe("RBAC — user", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test("cannot access company routes", async ({ page }) => {
    await page.goto("/company/users");
    await expect(page).not.toHaveURL(/\/company\/users/);
  });
});
