import { test, expect } from "@playwright/test";
import { getTownTime, phaseLabel, smoothstep } from "../lib/town/clock";

test("the town follows Pakistan's clock across UTC date rollover", () => {
  const midnight = getTownTime(new Date("2026-10-31T19:00:00.000Z"));
  expect(midnight).toMatchObject({
    hour: 0, minute: 0, second: 0, phase: "night", night: 1,
    timeLabel: "00:00 PKT", timezone: "Asia/Karachi",
  });
  const noon = getTownTime(new Date("2026-11-01T07:00:00.000Z"));
  expect(noon).toMatchObject({ hour: 12, phase: "day", night: 0, golden: 0 });
  expect(noon.sunProgress).toBe(.5);
});

test("morning and evening have gradual, real-time twilight and warm light", () => {
  const morning = getTownTime(new Date("2026-11-01T01:00:00.000Z")); // 06:00 PKT
  expect(morning.phase).toBe("morning");
  expect(morning.night).toBe(.5);
  expect(morning.golden).toBeGreaterThan(.7);
  const evening = getTownTime(new Date("2026-11-01T13:00:00.000Z")); // 18:00 PKT
  expect(evening.phase).toBe("evening");
  expect(evening.night).toBe(.5);
  expect(evening.golden).toBeGreaterThan(.8);
  expect(getTownTime(new Date("2026-11-01T01:30:00.000Z")).golden).toBe(1);
  expect(getTownTime(new Date("2026-11-01T12:42:00.000Z")).golden).toBeCloseTo(1);
});

test("lighting remains continuous at sunrise and sunset band boundaries", () => {
  for (const utcHour of [0, 2, 12, 14]) { // 05, 07, 17, 19 PKT
    const instant = Date.UTC(2026, 10, 1, utcHour);
    const before = getTownTime(new Date(instant - 1)).night;
    const after = getTownTime(new Date(instant + 1)).night;
    expect(Math.abs(before - after)).toBeLessThan(.000001);
  }
  expect(smoothstep(5, 7, 4)).toBe(0);
  expect(smoothstep(5, 7, 8)).toBe(1);
});

test("clock labels and phase do not depend on the visitor's timezone", () => {
  const oldTimezone = process.env.TZ;
  try {
    process.env.TZ = "America/Los_Angeles";
    const west = getTownTime(new Date("2026-11-01T12:45:23.500Z"));
    process.env.TZ = "Pacific/Auckland";
    const east = getTownTime(new Date("2026-11-01T12:45:23.500Z"));
    expect(east).toEqual(west);
    expect(east).toMatchObject({ hour: 17, minute: 45, second: 23, phase: "evening", timeLabel: "17:45 PKT" });
    expect(east.hourFraction).toBeCloseTo(17 + 45 / 60 + 23.5 / 3600, 10);
    expect(phaseLabel(east.phase)).toBe("Evening in Pakistan");
  } finally {
    if (oldTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = oldTimezone;
  }
});
