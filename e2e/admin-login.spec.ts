import { test, expect } from "@playwright/test";

/** Must match e2e/scripts/start-auth-for-playwright.sh */
const E2E_USERNAME = "e2e_admin";
const E2E_PASSWORD = "E2E_Pass_123";

const INVALID_CREDENTIALS_MESSAGE = "用户名或密码错误";

test.describe("admin-web login (Issue #3)", () => {
  test("AC1: seeded user can log in and reach dashboard", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-page")).toBeVisible();

    await page.getByTestId("login-username").fill(E2E_USERNAME);
    await page.getByTestId("login-password").fill(E2E_PASSWORD);
    await page.getByTestId("login-submit").click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    await expect(page.getByTestId("dashboard-title")).toHaveText("控制台");
    await expect(page.getByTestId("dashboard-username")).toContainText(E2E_USERNAME);
  });

  test("AC2: unknown username shows generic invalid-credentials message", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByTestId("login-username").fill("__no_such_user__");
    await page.getByTestId("login-password").fill("any-password");
    await page.getByTestId("login-submit").click();

    await expect(page.getByTestId("login-error")).toHaveText(INVALID_CREDENTIALS_MESSAGE);
    await expect(page).toHaveURL(/\/login/);
  });

  test("AC3: wrong password shows the same message as unknown user", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByTestId("login-username").fill(E2E_USERNAME);
    await page.getByTestId("login-password").fill("definitely_wrong_password");
    await page.getByTestId("login-submit").click();

    await expect(page.getByTestId("login-error")).toHaveText(INVALID_CREDENTIALS_MESSAGE);
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated /dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("login-page")).toBeVisible();
  });

  test("logout returns to login", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-username").fill(E2E_USERNAME);
    await page.getByTestId("login-password").fill(E2E_PASSWORD);
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("dashboard-page")).toBeVisible();

    await page.getByTestId("dashboard-logout").click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("login-page")).toBeVisible();
  });
});
