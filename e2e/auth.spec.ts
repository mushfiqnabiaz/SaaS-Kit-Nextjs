import { expect, test } from "@playwright/test";
import { CREDENTIALS, login, loginAs } from "./helpers/auth";

test.describe("Auth pages UI", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  });

  test("register page renders", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create|sign up|register/i })).toBeVisible();
  });

  test("forgot-password page renders redesigned UI", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /back to sign in/i })).toBeVisible();
    await expect(page.getByText(/didn't receive a verification/i)).not.toBeVisible();
  });

  test("forgot-password success state", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.locator("#email").fill(CREDENTIALS.companyAdmin.email);
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(page.getByRole("heading", { name: /check your inbox/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/open the email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /send again/i })).toBeVisible();
  });

  test("reset-password without token shows error", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText(/invalid reset link/i)).toBeVisible();
  });

  test("invalid login shows error", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("wrong@example.com");
    await page.locator("#password").fill("WrongPass1");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });
});

test.describe.serial("Credentials login by role", () => {
  test("superadmin lands on superadmin dashboard", async ({ page }) => {
    await loginAs(page, "superadmin");
  });

  test("company_admin lands on company dashboard", async ({ page }) => {
    await loginAs(page, "companyAdmin");
  });

  test("user lands on app dashboard", async ({ page }) => {
    await loginAs(page, "user");
  });
});

test.describe("Auth navigation", () => {
  test("login ↔ forgot-password links", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await page.getByRole("link", { name: /back to sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("login ↔ register links", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});
