import { test, expect } from "@playwright/test";
test("desktop/mobile visual inspection and draft resume", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  await page.screenshot({ path: "/tmp/bluebook-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/tmp/bluebook-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Start Recall Session" }).click();
  await page
    .getByLabel("Your recall attempt")
    .fill("An unfinished argument to resume");
  await page.reload();
  await expect(page.getByLabel("Your recall attempt")).toHaveValue(
    "An unfinished argument to resume",
  );
  await expect(page.getByText("CANONICAL SKELETON")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
