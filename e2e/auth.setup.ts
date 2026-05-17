import { test as setup } from "@playwright/test";
import { loginAs, type AuthRole } from "./helpers/auth";

const roles: AuthRole[] = ["superadmin", "companyAdmin", "user"];

for (const role of roles) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await loginAs(page, role);
    await page.context().storageState({ path: `e2e/.auth/${role}.json` });
  });
}
