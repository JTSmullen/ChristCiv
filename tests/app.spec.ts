import { test, expect } from "@playwright/test";
test("recall hides answers until an attempt; scoring persists and notes do not earn mastery", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Prepare to think on paper." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start Recall Session" }).click();
  await expect(page.getByText("CANONICAL SKELETON")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Submit & compare" }),
  ).toBeDisabled();
  await page
    .getByLabel("Your recall attempt")
    .fill("From nothing, through the Word, toward God.");
  await page.getByRole("button", { name: "Submit & compare" }).click();
  await expect(page.getByText("CANONICAL SKELETON")).toBeVisible();
  for (const radio of await page
    .getByRole("radio", { name: "Got it", exact: true })
    .all())
    await radio.check();
  await page
    .getByRole("button", { name: "Save score & schedule review" })
    .click();
  await expect(page.getByRole("status")).toContainText("Attempt saved");
  await page.getByRole("button", { name: "Return to dashboard" }).click();
  await page.reload();
  await expect(page.locator(".stats")).toContainText("1");
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem("bluebook-v1")!).reviews,
  );
  await page
    .getByRole("button", { name: "Reference notes", exact: true })
    .click();
  await page.locator("summary").first().click();
  await page.getByRole("button", { name: "Edit local notes" }).click();
  await page.getByLabel("Edit your local notes").fill("My local reflection");
  await page.getByRole("button", { name: "Save notes" }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("bluebook-v1")!).reviews,
    ),
  ).toEqual(before);
});
test("handwriting isolates the prompt and asks for confidence before the outline", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Exam room", exact: true }).click();
  await page.getByRole("button", { name: "Draw a random prompt" }).click();
  await expect(page.getByRole("timer")).toContainText("75:");
  await expect(page.locator("aside")).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveCount(0);
  await expect(page.getByText("CANONICAL REFERENCE")).toHaveCount(0);
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Finish attempt early" }).click();
  await expect(page.getByText("CANONICAL REFERENCE")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Reveal outline & self-grade" })
    .click();
  await expect(page.getByText("CANONICAL REFERENCE")).toBeVisible();
});
test("cards, contrasts and outlines enforce attempts and provide feedback", async ({
  page,
}) => {
  await page.goto("/");
  for (const mode of [
    "Focused Recall Cards",
    "Contrast Drills",
    "Full Outline Recall",
  ]) {
    await page.getByRole("button", { name: "Practice", exact: true }).click();
    await page
      .locator(".mode")
      .filter({ has: page.getByRole("heading", { name: mode, exact: true }) })
      .getByRole("button")
      .click();
    await expect(page.getByText("CANONICAL REFERENCE")).toHaveCount(0);
    await page.getByLabel("Your recall attempt").fill("An unaided attempt");
    await page.getByRole("button", { name: "Submit & compare" }).click();
    await expect(page.getByText("CANONICAL REFERENCE")).toBeVisible();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  }
});
test("settings reset requires confirmation and mobile layout fits", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".essay-card")).toHaveCount(6);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Theme", { exact: true }).selectOption("dark");
  await page.getByRole("button", { name: "Reset progress…" }).click();
  await expect(
    page.getByRole("button", { name: "Yes, reset progress" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("sprint timeout reveals feedback and typed exam keeps its essay", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Start Recall Session" }).click();
  await page.getByLabel("Your recall attempt").fill("My argument chain");
  await page.clock.fastForward(121000);
  await expect(page.getByText("CANONICAL SKELETON")).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Exam room", exact: true }).click();
  await page
    .getByRole("radio", { name: "Typed Mode · write in the app" })
    .check();
  await page.getByRole("button", { name: "Draw a random prompt" }).click();
  await page
    .getByLabel("Your essay", { exact: true })
    .fill("An essay written from memory.");
  await page.getByRole("button", { name: "Submit & compare" }).click();
  await expect(
    page.getByText("An essay written from memory.", { exact: true }),
  ).toBeVisible();
  for (const radio of await page
    .getByRole("radio", { name: "2 · Solid", exact: true })
    .all())
    await radio.check();
  await page
    .getByRole("button", { name: "Save score & schedule review" })
    .click();
  await expect(page.getByRole("status")).toContainText("Attempt saved");
  const attempt = await page.evaluate(
    () => JSON.parse(localStorage.getItem("bluebook-v1")!).attempts[0],
  );
  expect(attempt.kind).toBe("exam");
  expect(attempt.response).toBe("An essay written from memory.");
});
test("JSON import validates and only replaces progress after confirmation", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await expect(page.getByRole("alert")).toContainText("Not a Bluebook");
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bluebook-v1")!),
  );
  data.notes = { "1": "Imported notes" };
  page.once("dialog", (d) => d.accept());
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await expect(page.getByRole("alert")).toContainText("successfully");
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("bluebook-v1")!).notes["1"],
    ),
  ).toBe("Imported notes");
});

test("learning shows explanations freely and transfers the selected topic to recall without earning mastery", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Learn the material", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Thesis", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Make sense of it in your own words")
    .fill("Creation depends on God.");
  await page.getByRole("button", { name: "Next lesson" }).click();
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(
    page.getByLabel("Make sense of it in your own words"),
  ).toHaveValue("Creation depends on God.");
  await page.getByLabel("Choose an essay").selectOption("4");
  await page
    .getByRole("button", { name: "Learning flashcards", exact: true })
    .click();
  await expect(page.locator(".learn-answer")).toHaveCount(0);
  await page.getByRole("button", { name: "Flip to explanation" }).click();
  await expect(page.locator(".learn-answer")).toContainText("depend on grace");
  await page.getByRole("button", { name: "Revisit this card" }).click();
  await page.getByLabel("Only cards marked “Revisit”").check();
  await expect(
    page.getByText("FLASHCARD 1 OF 1", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove revisit mark" }).click();
  await expect(
    page.getByRole("heading", { name: "No cards marked for revisiting." }),
  ).toBeVisible();
  await page.getByLabel("Only cards marked “Revisit”").uncheck();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bluebook-v1")!),
  );
  expect(state.attempts).toEqual([]);
  expect(state.reviews).toEqual({});
  await page
    .getByRole("button", { name: "Practice this question", exact: true })
    .click();
  await expect(page.getByText("CANONICAL REFERENCE")).toHaveCount(0);
  await page
    .getByLabel("Your recall attempt")
    .fill("They relate directly to God.");
  await page.getByRole("button", { name: "Submit & compare" }).click();
  await expect(page.getByText("CANONICAL REFERENCE")).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("bluebook-draft")!).itemId,
    ),
  ).toBe("4-card-0");
});
