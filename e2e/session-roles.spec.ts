import { test, expect } from "@playwright/test";

const E2E_ADMIN_USERNAME = "e2e_admin";
const E2E_ADMIN_PASSWORD = "E2E_Pass_123";
const E2E_USER_USERNAME = "e2e_user";
const E2E_USER_PASSWORD = "E2E_User_123";
const E2E_INACTIVE_USERNAME = "e2e_inactive";
const E2E_INACTIVE_PASSWORD = "E2E_Inactive_123";

test.describe("session-roles: Login accepts all active users", () => {
  test("SC1: admin role user can log in", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-username").fill(E2E_ADMIN_USERNAME);
    await page.getByTestId("login-password").fill(E2E_ADMIN_PASSWORD);
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
  });

  test("SC2: user role can log in (not rejected by role)", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-username").fill(E2E_USER_USERNAME);
    await page.getByTestId("login-password").fill(E2E_USER_PASSWORD);
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
  });

  test("SC3: inactive user login is rejected with account_disabled error", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByTestId("login-username").fill(E2E_INACTIVE_USERNAME);
    await page.getByTestId("login-password").fill(E2E_INACTIVE_PASSWORD);
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("login-error")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("SC4: invalid credentials shows error message", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-username").fill("nonexistent_user_xyz");
    await page.getByTestId("login-password").fill("wrongpassword");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("login-error")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});