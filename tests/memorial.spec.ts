import { test as base, expect } from "@playwright/test";

// A visually successful render must also finish without uncaught client errors.
const test = base.extend<{ noPageErrors: void }>({
  noPageErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });
    await use();
    expect(errors, "Uncaught browser errors and console errors").toEqual([]);
  }, { auto: true }],
});

test("the story pauses, resumes its remaining time, reaches a dedication, and replays", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Insha — The Brightest Star");
  await expect(page.getByRole("heading", { name: "Insha", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Enter the meadow" }).click();
  const meadow = page.getByRole("heading", { name: "Here, the world slows down." });
  await expect(meadow).toBeVisible();

  // Spend part of the chapter, then stay paused longer than an entire chapter.
  // The real clock also exercises the animation and browser timeout together.
  await page.waitForTimeout(3500);
  await page.getByRole("button", { name: "Pause story", exact: true }).click();
  await expect(page.getByRole("button", { name: "Resume story", exact: true })).toBeVisible();
  await page.waitForTimeout(10_500);
  await expect(meadow).toBeVisible();
  await expect(page.getByRole("heading", { name: "And softly, the stars arrive." })).toHaveCount(0);

  await page.getByRole("button", { name: "Resume story", exact: true }).click();
  // A full-duration restart would take over eleven seconds to reveal this text.
  await expect(page.getByRole("heading", { name: "And softly, the stars arrive." })).toBeVisible({ timeout: 8500 });
  await expect(page.getByRole("button", { name: "Go to Nightfall" })).toHaveAttribute("aria-current", "step");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Among the stars, there is you." })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("button", { name: "Send a little prayer" })).toBeVisible();

  await page.getByRole("button", { name: "Send a little prayer" }).click();
  await expect(page.getByRole("status")).toHaveText("Your prayer joins the light.");
  await expect(page.getByRole("button", { name: "Held in the light" })).toBeVisible();
  await expect(page.locator(".prayer-spark")).toHaveCount(1);
  await expect(page.locator(".prayer-spark")).toHaveCount(0);

  await page.getByRole("button", { name: "Experience again" }).click();
  await expect(page.getByRole("button", { name: "Enter the meadow" })).toBeVisible();
  await expect(page.getByRole("status")).toBeEmpty();
  await expect(page.locator(".prayer-spark")).toHaveCount(0);
});

test("about and prayer dialogs support keyboard dismissal and return focus", async ({ page }) => {
  await page.goto("/");
  const aboutButton = page.getByRole("button", { name: "About this memorial" });
  await aboutButton.click();
  const about = page.getByRole("dialog", { name: "A light that stays." });
  await expect(about).toBeVisible();
  await expect(about.getByText("Nothing is collected or shared.", { exact: false })).toBeVisible();
  await expect(about.getByRole("button", { name: "Close dialog" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(about).not.toBeVisible();
  await expect(aboutButton).toBeFocused();

  await page.getByRole("button", { name: "Go to Always" }).click();
  const prayerButton = page.getByRole("button", { name: "A moment of prayer" });
  await prayerButton.click();
  const prayer = page.getByRole("dialog", { name: "Held in His mercy." });
  await expect(prayer).toBeVisible();
  await expect(prayer.locator('[lang="ar"]')).toBeVisible();
  await expect(prayer.getByText("Indeed, we belong to Allah, and to Him we return.")).toBeVisible();
  await prayer.getByRole("button", { name: "Back to the meadow" }).click();
  await expect(prayer).not.toBeVisible();
  await expect(prayerButton).toBeFocused();
});

test("ambient sound starts muted and can be enabled and muted again", async ({ page }) => {
  await page.goto("/");
  const sound = page.getByRole("button", { name: "Enable ambient sound" });
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await expect(sound).toHaveText("Sound off");
  await sound.click();
  const mute = page.getByRole("button", { name: "Mute ambient sound" });
  await expect(mute).toHaveAttribute("aria-pressed", "true");
  await expect(mute).toHaveText("Sound on");
  await mute.click();
  await expect(page.getByRole("button", { name: "Enable ambient sound" })).toHaveAttribute("aria-pressed", "false");
});

test("reduced motion keeps chapters still until the visitor continues", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter the meadow" }).click();
  const meadow = page.getByRole("heading", { name: "Here, the world slows down." });
  await expect(meadow).toBeVisible();
  await expect(page.getByRole("button", { name: "Pause story" })).toHaveCount(0);
  await page.waitForTimeout(11_000);
  await expect(meadow).toBeVisible();

  for (const heading of ["And softly, the stars arrive.", "Among the stars, there is you.", "Insha"]) {
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Experience again" })).toBeVisible();
});

for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
  test(`the memorial remains usable at ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const begin = page.getByRole("button", { name: "Enter the meadow" });
    await begin.scrollIntoViewIfNeeded();
    await expect(begin).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    const lastChapter = page.getByRole("button", { name: "Go to Always" });
    await lastChapter.scrollIntoViewIfNeeded();
    await expect(lastChapter).toBeInViewport();
    await lastChapter.click();
    const prayer = page.getByRole("button", { name: "Send a little prayer" });
    await prayer.scrollIntoViewIfNeeded();
    await expect(prayer).toBeInViewport();
    await prayer.click();
    await expect(page.getByRole("status")).toHaveText("Your prayer joins the light.");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
