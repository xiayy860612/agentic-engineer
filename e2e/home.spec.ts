import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("AC1: homepage is accessible and renders without errors", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Agentic Engineer/i);
    await expect(page.locator("h1")).toContainText("Agentic Engineer");
  });

  test("AC2: shadcn Button component is present", async ({ page }) => {
    await page.goto("/");
    const getStartedBtn = page.getByRole("button", { name: /get started/i });
    await expect(getStartedBtn).toBeVisible();
  });

  test("AC5: responsive layout — no horizontal overflow at any viewport", async ({
    page,
  }) => {
    const viewports = [
      { name: "mobile", width: 375, height: 812 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "desktop", width: 1280, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const body = page.locator("body");
      const overflowX = await body.evaluate(
        (el) => el.scrollWidth - el.clientWidth
      );
      expect(overflowX).toBe(0);
    }
  });

  test("AC5: features grid adapts columns per breakpoint", async ({
    page,
  }) => {
    // Mobile: 1 column
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const grid = page.locator(".grid");
    await expect(grid).toHaveClass(/grid-cols-1/);

    // Tablet: 2 columns
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(grid).toHaveClass(/sm:grid-cols-2/);

    // Desktop: 3 columns
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await expect(grid).toHaveClass(/lg:grid-cols-3/);
  });
});
