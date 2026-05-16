import { test, expect } from "@playwright/test";

const E2E_ADMIN_USERNAME = "e2e_admin";
const E2E_ADMIN_PASSWORD = "E2E_Pass_123";
const E2E_USER_USERNAME = "e2e_user";
const E2E_USER_PASSWORD = "E2E_User_123";

test.describe("user-role-based-admin-access: Navbar admin link visibility", () => {
  async function loginAsAdmin(page: any) {
    await page.goto("/login");
    await page.getByTestId("login-username").fill(E2E_ADMIN_USERNAME);
    await page.getByTestId("login-password").fill(E2E_ADMIN_PASSWORD);
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/dashboard$/);
  }

  async function loginAsUser(page: any) {
    await page.goto("/login");
    await page.getByTestId("login-username").fill(E2E_USER_USERNAME);
    await page.getByTestId("login-password").fill(E2E_USER_PASSWORD);
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL(/\/dashboard$/);
  }

  // RA1: Admin user sees "用户管理" in navbar
  test("RA1: admin sees 用户管理 nav link after login", async ({ page }) => {
    await loginAsAdmin(page);
    // Navigate to dashboard and wait for Navbar to fully hydrate with admin state
    await page.goto("/dashboard");
    await page.waitForFunction(() => {
      const nav = document.querySelector("nav");
      return nav && nav.innerHTML.includes("用户管理");
    }, { timeout: 10000 });
    await expect(page.locator("nav").getByText("用户管理")).toBeVisible();
  });

  // RA2: Non-admin user does NOT see "用户管理" in navbar
  test("RA2: user role does NOT see 用户管理 nav link", async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/dashboard");
    await page.waitForFunction(() => {
      const nav = document.querySelector("nav");
      return nav && !nav.innerHTML.includes("用户管理");
    }, { timeout: 10000 });
    await expect(page.locator("nav").getByText("用户管理")).not.toBeVisible();
  });

  // RA3: Admin user can navigate to /users
  test("RA3: admin can access /users page", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/dashboard");
    await page.waitForFunction(() => {
      const nav = document.querySelector("nav");
      return nav && nav.innerHTML.includes("用户管理");
    }, { timeout: 10000 });
    await page.locator("nav").getByText("用户管理").click();
    await expect(page).toHaveURL(/\/users/);
    await expect(page.locator("h1")).toContainText("用户管理");
  });
});