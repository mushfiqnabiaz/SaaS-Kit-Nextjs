import { expect, test } from "@playwright/test";
import { CREDENTIALS, loginAs } from "./helpers/auth";

test.describe("Superadmin — authenticated UI", () => {
  test.use({ storageState: "e2e/.auth/superadmin.json" });

  const routes = [
    { path: "/superadmin/dashboard", heading: /^overview$/i },
    { path: "/superadmin/companies", heading: /^companies$/i },
    { path: "/superadmin/users", heading: /^users$/i },
    { path: "/superadmin/audit-logs", heading: /^audit logs$/i },
    { path: "/superadmin/settings", heading: /^settings$/i },
  ] as const;

  for (const route of routes) {
    test(`loads ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path.replace("/", "\\/")));
      await expect(page.getByRole("heading", { name: route.heading, level: 1 })).toBeVisible({
        timeout: 15_000,
      });
    });
  }

  test("sidebar navigation between pages", async ({ page }) => {
    await page.goto("/superadmin/dashboard");
    await page.getByRole("link", { name: /^companies$/i }).click();
    await expect(page).toHaveURL(/\/superadmin\/companies/);
    await page.getByRole("link", { name: /^users$/i }).click();
    await expect(page).toHaveURL(/\/superadmin\/users/);
  });

  test("companies table has create action", async ({ page }) => {
    await page.goto("/superadmin/companies");
    await expect(page.getByRole("button", { name: /new company/i })).toBeVisible();
  });
});

test.describe("Company admin — authenticated UI", () => {
  test.use({ storageState: "e2e/.auth/companyAdmin.json" });

  const routes = [
    { path: "/company/dashboard", heading: /^dashboard$/i },
    { path: "/company/users", heading: /^team$/i },
    { path: "/company/roles", heading: /roles.*permissions/i, level: undefined as number | undefined },
    { path: "/company/users/invite", heading: /^invite$/i },
    { path: "/company/audit-logs", heading: /^audit logs$/i },
    { path: "/company/settings", heading: /^settings$/i },
  ] as const;

  for (const route of routes) {
    test(`loads ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path.replace("/", "\\/")));
      if (route.path === "/company/roles") {
        await expect(page.getByRole("heading", { name: route.heading })).toBeVisible({
          timeout: 15_000,
        });
      } else {
        await expect(page.getByRole("heading", { name: route.heading, level: 1 })).toBeVisible({
          timeout: 15_000,
        });
      }
    });
  }

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/company/dashboard");
    await page.getByRole("link", { name: /^team$/i }).click();
    await expect(page).toHaveURL(/\/company\/users/);
    await page.getByRole("link", { name: /^roles$/i }).click();
    await expect(page).toHaveURL(/\/company\/roles/);
  });

  test("sign out returns to login", async ({ page }) => {
    await page.goto("/company/dashboard");
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });
});

test.describe("User — authenticated UI", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  const routes = [
    { path: "/app/dashboard", heading: /^dashboard$/i },
    { path: "/app/profile", heading: /^my profile$/i },
    { path: "/app/team", heading: /^team$/i },
    { path: "/app/notifications", heading: /^notifications$/i },
  ] as const;

  for (const route of routes) {
    test(`loads ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(route.path.replace("/", "\\/")));
      await expect(page.getByRole("heading", { name: route.heading, level: 1 })).toBeVisible({
        timeout: 15_000,
      });
    });
  }

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/app/dashboard");
    await page.getByRole("link", { name: /my profile/i }).click();
    await expect(page).toHaveURL(/\/app\/profile/);
    await expect(page.getByRole("main").getByText(CREDENTIALS.user.email)).toBeVisible();
  });
});

test.describe("Auth guards — unauthenticated & cross-role", () => {
  test("unauthenticated user is redirected from protected routes", async ({ page }) => {
    await page.goto("/app/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/company/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/superadmin/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe(() => {
    test.use({ storageState: "e2e/.auth/companyAdmin.json" });

    test("company_admin blocked from superadmin, allowed on app routes", async ({ page }) => {
      await page.goto("/superadmin/dashboard");
      await expect(page).not.toHaveURL(/\/superadmin\/dashboard/);
      await page.goto("/app/dashboard");
      await expect(page).toHaveURL(/\/app\/dashboard/);
    });
  });

  test.describe(() => {
    test.use({ storageState: "e2e/.auth/user.json" });

    test("user cannot access company or superadmin shells", async ({ page }) => {
      await page.goto("/company/dashboard");
      await expect(page).not.toHaveURL(/\/company\/dashboard/);
      await page.goto("/superadmin/dashboard");
      await expect(page).not.toHaveURL(/\/superadmin\/dashboard/);
    });
  });

  test.describe(() => {
    test.use({ storageState: "e2e/.auth/superadmin.json" });

    test("superadmin blocked from company shell", async ({ page }) => {
      await page.goto("/company/dashboard");
      await expect(page).not.toHaveURL(/\/company\/dashboard/);
    });
  });
});
