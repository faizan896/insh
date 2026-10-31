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
  test.setTimeout(90_000);
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

test("the three-dimensional meadow renders, stays alive, and can be explored", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  const world = page.locator('.living-world[data-world-ready="true"]');
  await expect(world).toBeVisible({ timeout: 45_000 });
  const canvas = world.locator("canvas");
  await expect(canvas).toBeVisible();
  const resolution = await canvas.evaluate(element => {
    if (!(element instanceof HTMLCanvasElement)) throw new Error("The world must use a real canvas");
    return { width: element.width, height: element.height };
  });
  expect(resolution.width).toBeGreaterThan(100);
  expect(resolution.height).toBeGreaterThan(100);

  // Compare actual rendered pixels, rather than just checking for a canvas tag.
  // The opening waits for the visitor, so no chapter transition causes this change.
  await page.waitForTimeout(2000);
  const before = await canvas.screenshot();
  await page.waitForTimeout(1200);
  const later = await canvas.screenshot();
  expect(before.equals(later), "The living world should animate between rendered frames").toBe(false);

  // Freeze ambient motion before testing the camera, so this comparison cannot
  // pass solely because an animal or the water moved.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(500);
  const still = await canvas.screenshot();
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("The world canvas must have visible bounds");
  await page.mouse.move(bounds.x + bounds.width * .5, bounds.y + bounds.height * .5);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * .61, bounds.y + bounds.height * .54, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(250);
  const explored = await canvas.screenshot();
  expect(still.equals(explored), "Dragging should change the rendered camera view").toBe(false);
  await canvas.focus();
  await page.keyboard.press("r");
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
