import { test as base, expect, type Page } from "@playwright/test";

const DAY = "2026-11-01T07:00:00.000Z"; // 12:00 in Pakistan, not in the visitor's timezone.
const NIGHT = "2026-11-01T17:30:00.000Z"; // 22:30 in Pakistan.

// Rendering warnings must not be hidden by a visually successful screenshot.
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

async function openTown(page: Page, instant = NIGHT) {
  // Freeze Date, not the animation clock. The production app still reads its
  // actual clock; there is no production day/night preview or accelerated cycle.
  await page.clock.setFixedTime(new Date(instant));
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-world-ready", "true", { timeout: 45_000 });
  await expect(page.locator(".town-loading")).toHaveCount(0);
}

test("the full-screen painted town renders and its environment keeps moving", async ({ page }) => {
  await openTown(page);
  await expect(page.getByRole("heading", { name: "Insha", exact: true })).toBeVisible();
  const stage = page.locator(".town-stage");
  await expect(stage.locator("canvas")).toHaveCount(2);
  const geometry = await stage.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return { width: bounds.width, height: bounds.height, viewportWidth: innerWidth, viewportHeight: innerHeight };
  });
  expect(geometry.width).toBeCloseTo(geometry.viewportWidth, 0);
  expect(geometry.height).toBeCloseTo(geometry.viewportHeight, 0);
  const buffer = await stage.locator("canvas").first().evaluate(element => ({
    width: (element as HTMLCanvasElement).width,
    height: (element as HTMLCanvasElement).height,
  }));
  expect(buffer.width).toBeGreaterThan(100);
  expect(buffer.height).toBeGreaterThan(100);

  // Exclude the interface and its star animation: these are pixels from the
  // water, foliage, smoke, and atmosphere layers of the actual artwork.
  await page.waitForTimeout(1000);
  const firstFrame = await stage.screenshot();
  await page.waitForTimeout(1500);
  const laterFrame = await stage.screenshot();
  expect(firstFrame.equals(laterFrame), "The town artwork must animate, not just contain a canvas").toBe(false);
});

test("the real Pakistan clock remains correct for a visitor in Los Angeles", async ({ page }) => {
  await openTown(page, DAY);
  expect(await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)).toBe("America/Los_Angeles");
  await expect(page.locator("main")).toHaveAttribute("data-phase", "day");
  await expect(page.locator("main")).toHaveClass(/theme-day/);
  await expect(page.locator(".pakistan-time time")).toHaveText("12:00 PKT");
  await expect(page.locator(".pakistan-time")).toContainText("Day in Pakistan");
  expect(await page.locator("main").evaluate(element => Number(getComputedStyle(element).getPropertyValue("--night")))).toBe(0);
});

test("night in Pakistan changes the painted lighting as well as the clock label", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openTown(page, NIGHT);
  await expect(page.locator("main")).toHaveAttribute("data-phase", "night");
  await expect(page.locator("main")).toHaveClass(/theme-night/);
  await expect(page.locator(".pakistan-time time")).toHaveText("22:30 PKT");
  await expect(page.locator(".pakistan-time")).toContainText("Night in Pakistan");
  await page.waitForTimeout(800);
  const nightArt = await page.locator(".town-stage").screenshot();

  await openTown(page, DAY);
  await page.waitForTimeout(800);
  const daylightArt = await page.locator(".town-stage").screenshot();
  expect(nightArt.equals(daylightArt), "The scene's lighting must change, not only its interface label").toBe(false);
});

test("Insha's star opens a dedication and supports keyboard dismissal and prayer", async ({ page }) => {
  await openTown(page);
  const star = page.getByRole("button", { name: "Insha’s star", exact: true });
  await star.click();
  const dedication = page.getByRole("dialog", { name: "Insha", exact: true });
  await expect(dedication).toBeVisible();
  await expect(dedication.getByText("The brightest star in our sky.", { exact: true })).toBeVisible();
  await expect(dedication.getByRole("button", { name: "Close dedication" })).toBeFocused();
  await expect(star).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(dedication).toHaveCount(0);
  await expect(star).toBeFocused();
  await expect(star).toHaveAttribute("aria-expanded", "false");

  await star.click();
  await dedication.getByRole("button", { name: "Offer a prayer for Insha" }).click();
  await expect(dedication).toHaveCount(0);
  await expect(page.locator(".prayer-feedback")).toHaveText("Your prayer joins her light.");
  await expect(star).toBeFocused();
});

test("quiet prayers remain usable and a new prayer keeps its own feedback time", async ({ page }) => {
  await openTown(page);
  const prayer = page.locator(".offer-prayer");
  await expect(prayer).toHaveText("Offer a quiet prayer");
  await prayer.click();
  await expect(page.locator(".prayer-feedback")).toHaveText("Your prayer joins her light.");
  await expect(prayer).toHaveText("Held in her light");
  await page.waitForTimeout(3500);
  await prayer.click();
  await page.waitForTimeout(3100);
  // The first prayer's six seconds have expired, but the new one still has time.
  await expect(page.locator(".prayer-feedback")).toHaveText("Your prayer joins her light.");
  await expect(page.locator(".prayer-feedback")).toBeEmpty({ timeout: 8000 });
  await expect(prayer).toHaveText("Offer a quiet prayer");
});

test("sound starts off and can be enabled and muted again", async ({ page }) => {
  await openTown(page);
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

test("reduced motion keeps the actual artwork still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openTown(page);
  await expect(page.locator("main")).toHaveClass(/reduced-motion/);
  await page.waitForTimeout(1000);
  const firstFrame = await page.locator(".town-stage").screenshot();
  await page.waitForTimeout(700);
  const laterFrame = await page.locator(".town-stage").screenshot();
  expect(firstFrame.equals(laterFrame), "Water, foliage, smoke, and sky should respect reduced motion").toBe(true);
  await page.locator(".offer-prayer").click();
  await expect(page.locator(".prayer-feedback")).toHaveText("Your prayer joins her light.");
});

for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
  test(`the village and dedication remain usable at ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openTown(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator(".offer-prayer")).toBeInViewport();
    await page.getByRole("button", { name: "Insha’s star", exact: true }).click();
    const dedication = page.getByRole("dialog", { name: "Insha", exact: true });
    await expect(dedication).toBeInViewport();
    const bounds = await dedication.boundingBox();
    if (!bounds) throw new Error("The star dedication must have visible bounds");
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    await dedication.getByRole("button", { name: "Close dedication" }).click();
    await page.locator(".offer-prayer").click();
    await expect(page.locator(".prayer-feedback")).toHaveText("Your prayer joins her light.");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
