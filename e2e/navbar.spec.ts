import { test, expect } from "@playwright/test";

test.describe("Navbar", () => {
  test("AC6: PC viewport shows navigation links", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await expect(page.getByTestId("desktop-nav")).toBeVisible();
    await expect(page.getByTestId("nav-link-home")).toBeVisible();
  });

  test("AC6: mobile viewport shows hamburger menu button", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const hamburger = page.locator("button[aria-label='Toggle menu']");
    await expect(hamburger).toBeVisible();
  });

  test("AC6: mobile viewport — hamburger opens mobile menu on click", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const hamburger = page.locator("button[aria-label='Toggle menu']");

    // Menu should be closed initially (hamburger shows Menu icon)
    await expect(hamburger).toBeVisible();

    // Click to open
    await hamburger.click();
    await expect(page.getByTestId("mobile-nav")).toBeVisible();
    await expect(page.getByTestId("mobile-nav-link-home")).toBeVisible();

    // Click to close
    await hamburger.click();
    const mobileMenu = page.locator("nav").last();
    await expect(mobileMenu).not.toBeVisible();
  });
});
