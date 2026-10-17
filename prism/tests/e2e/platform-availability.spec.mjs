import { expect, test } from "@playwright/test";

test("the site describes current web availability without unavailable download cards", async ({ page }) => {
  await page.goto("/");

  const availability = page.locator("#apps");
  await expect(availability.getByRole("heading", { name: "PRISM is available on the web." })).toBeVisible();
  await expect(availability).toContainText("We’re focused on making the browser experience useful and reliable.");
  await expect(availability).toContainText("We’ll share news about other platforms when they’re ready.");
  await expect(availability.locator(".v2-platform-card")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Download when ready/i })).toHaveCount(0);
});

test("web availability message fits desktop and mobile viewports", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 360, height: 800 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const availability = page.locator("#apps");
    await expect(availability.getByRole("heading", { name: "PRISM is available on the web." })).toBeVisible();
    const bounds = await availability.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(await availability.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
});
