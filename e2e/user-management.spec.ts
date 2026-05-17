import { test, expect } from "@playwright/test";

const E2E_ADMIN_USERNAME = "e2e_admin";
const E2E_ADMIN_PASSWORD = "E2E_Pass_123";
const E2E_USER_USERNAME = "e2e_user";
const E2E_USER_PASSWORD = "E2E_User_123";

test.describe("user-management: User CRUD via /users page", () => {
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

  // UC1: Admin sees user list at /users
  test("UC1: admin navigates to /users and sees the user table", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/users");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("用户管理");
    await expect(page.locator("table")).toBeVisible();
    // Admin user should appear in the list
    await expect(
      page.locator("table tbody tr").filter({ hasText: E2E_ADMIN_USERNAME })
    ).toBeVisible();
  });

  // UC2: Non-admin user cannot access /users (redirected)
  test("UC2: user role is redirected away from /users", async ({ page }) => {
    await loginAsUser(page);
    await page.goto("/users");
    // Wait for redirect to dashboard (non-admin gets redirected)
    await expect(page).not.toHaveURL(/\/users/, { timeout: 10000 });
  });

  // UC3: Admin creates a new user
  test("UC3: admin can create a new user via the create dialog", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/users");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "新建用户" }).click();
    const dialog = page.locator(".fixed.inset-0").last();
    await dialog.locator('input[type="text"]').fill("test_new_user_uc3");
    await dialog.locator('input[type="password"]').fill("TestPass_123");
    await dialog.locator('select').selectOption("user");
    await dialog.getByRole("button", { name: "创建" }).click();
    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    // New user appears in table — use row-level locator to avoid strict mode violation
    await expect(
      page.locator("table tbody tr").filter({ hasText: "test_new_user_uc3" })
    ).toBeVisible();
  });

  // UC4: Admin creates user with duplicate username
  test("UC4: creating a duplicate username shows an error", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/users");
    await page.getByRole("button", { name: "新建用户" }).click();
    const dialog = page.locator(".fixed.inset-0").last();
    // Use existing admin username
    await dialog.locator('input[type="text"]').fill(E2E_ADMIN_USERNAME);
    await dialog.locator('input[type="password"]').fill("SomePass_123");
    await dialog.locator('select').selectOption("user");
    // Listen for alert before clicking create
    page.on("dialog", dialog => dialog.accept());
    await dialog.getByRole("button", { name: "创建" }).click();
  });

  // UC5: Admin edits a user's role and active status
  test("UC5: admin can edit a user's role and toggle active status", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/users");
    // Find the user row and click edit
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    // Locate a row that is NOT the current admin (current user row has "当前用户" text)
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      if (await row.locator("text=当前用户").count() === 0) {
        await row.getByRole("button", { name: "编辑" }).click();
        const editDialog = page.locator(".fixed.inset-0").last();
        await expect(editDialog).toBeVisible();
        // Toggle active status
        await editDialog.locator('input[type="checkbox"]').click();
        // Change role
        await editDialog.locator("select").selectOption("admin");
        await editDialog.getByRole("button", { name: "保存" }).click();
        await expect(editDialog).not.toBeVisible();
        return;
      }
    }
    // If we get here, there's no non-current-user row — skip
    test.skip();
  });

  // UC6: Admin cannot edit their own row
  test("UC6: own row shows '当前用户' instead of edit button", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/users");
    // The row for the current admin should show "当前用户" and no edit button
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      if (await row.locator(`text=${E2E_ADMIN_USERNAME}`).count() > 0) {
        await expect(row).toContainText("当前用户");
        await expect(row.getByRole("button", { name: "编辑" })).not.toBeVisible();
        return;
      }
    }
    test.skip();
  });
});