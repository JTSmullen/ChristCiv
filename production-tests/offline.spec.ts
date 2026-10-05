import { test, expect } from "@playwright/test";
test("production assets work offline after loading", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Prepare to think on paper." }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => resolve(),
          { once: true },
        ),
      );
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Start Recall Session" }),
  ).toBeVisible();
  await page.waitForTimeout(500);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Prepare to think on paper." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start Recall Session" }).click();
  await page.getByLabel("Your recall attempt").fill("Offline recall attempt");
  await page.getByRole("button", { name: "Submit & compare" }).click();
  await expect(page.getByText("CANONICAL SKELETON")).toBeVisible();
});
