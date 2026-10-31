export type TownPhase = "morning" | "day" | "evening" | "night";

export type TownTime = {
  hour: number;
  minute: number;
  second: number;
  hourFraction: number;
  night: number;
  golden: number;
  phase: TownPhase;
  timeLabel: string;
  timezone: "Asia/Karachi";
  sunProgress: number;
};

export const TOWN_TIMEZONE = "Asia/Karachi" as const;

// Explicit timezone, numbering system, and hour cycle keep every visitor in the
// same world, including browsers whose local clock uses another timezone.
const pakistanClock = new Intl.DateTimeFormat("en-GB-u-nu-latn", {
  timeZone: TOWN_TIMEZONE,
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

/** Zero slopes at both ends prevent visible lighting jumps at hour boundaries. */
export function smoothstep(start: number, end: number, value: number) {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function goldenBell(start: number, peak: number, end: number, hour: number) {
  return hour <= peak
    ? smoothstep(start, peak, hour)
    : 1 - smoothstep(peak, end, hour);
}

/**
 * Samples the real instant in Pakistan. The twilight colour bands are art
 * direction, not an astronomical sunrise calculation or an accelerated loop.
 * A different environment provider can reuse these conditions in future scenes.
 */
export function getTownTime(date = new Date()): TownTime {
  const parts = pakistanClock.formatToParts(date);
  const number = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find(part => part.type === type)?.value);
  const hour = number("hour");
  const minute = number("minute");
  const second = number("second");
  const hourFraction = hour + minute / 60 + second / 3600 + date.getUTCMilliseconds() / 3_600_000;

  const night = hourFraction < 12
    ? 1 - smoothstep(5, 7, hourFraction)
    : smoothstep(17, 19, hourFraction);
  const golden = Math.max(
    goldenBell(5, 6.5, 8.2, hourFraction),
    goldenBell(16.2, 17.7, 19.2, hourFraction),
  );
  const phase: TownPhase = hourFraction < 5 || hourFraction >= 19
    ? "night"
    : hourFraction < 10
      ? "morning"
      : hourFraction < 17
        ? "day"
        : "evening";

  return {
    hour, minute, second, hourFraction, night, golden, phase,
    timeLabel: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} PKT`,
    timezone: TOWN_TIMEZONE,
    sunProgress: clamp01((hourFraction - 5) / 14),
  };
}

export function phaseLabel(phase: TownPhase) {
  return `${phase.charAt(0).toUpperCase()}${phase.slice(1)} in Pakistan`;
}
