import { test, expect } from "@playwright/test";

test.describe("Navbar", () => {
  test("AC6: PC viewport shows horizontal navigation links", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const nav = page.locator("header nav");
    await expect(nav).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "About" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Blog" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Contact" })).toBeVisible();
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
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "About" })).toBeVisible();

    // Click to close
    await hamburger.click();
    const mobileMenu = page.locator("nav").last();
    await expect(mobileMenu).not.toBeVisible();
  });
});
