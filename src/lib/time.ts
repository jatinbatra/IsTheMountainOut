// Pacific-time helpers.
//
// The app runs on servers in UTC and in browsers anywhere, but everything it
// describes happens in Seattle. Never use Date#getHours() or parse an
// offset-less local timestamp with `new Date(...)` — both silently use the
// *machine's* timezone. Use these instead.

export const TZ = "America/Los_Angeles";

/** Current hour (0-23) in Seattle. */
export function ptHour(date: Date = new Date()): number {
  const h = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(date);
  return Number(h) % 24;
}

/** Hour (0-23) in Seattle of an ISO timestamp (must carry an offset or Z). */
export function ptHourOf(iso: string): number {
  return ptHour(new Date(iso));
}

/** "+HH:MM" / "-HH:MM" from an offset in seconds (Open-Meteo utc_offset_seconds). */
export function formatOffset(offsetSeconds: number): string {
  const sign = offsetSeconds < 0 ? "-" : "+";
  const abs = Math.abs(offsetSeconds);
  const hh = String(Math.floor(abs / 3600)).padStart(2, "0");
  const mm = String(Math.floor((abs % 3600) / 60)).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

/** Seattle's current UTC offset as "-07:00" / "-08:00" (DST-aware). */
export function ptOffset(date: Date = new Date()): string {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "shortOffset" })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT-8";
  const m = name.match(/GMT([+-])(\d{1,2})(?::(\d\d))?/);
  if (!m) return "+00:00";
  return `${m[1]}${m[2].padStart(2, "0")}:${m[3] ?? "00"}`;
}

/** Seattle calendar date "YYYY-MM-DD". */
export function ptDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: TZ });
}

/**
 * Open-Meteo returns local wall-clock times without an offset
 * ("2026-10-13T18:22"). Append the offset so `new Date()` is correct on any
 * machine, while the string still starts with the local date and time
 * ("2026-10-13T18:22-07:00"), so prefix/slice consumers keep working.
 */
export function withOffset(local: string | undefined | null, offset: string): string {
  if (!local) return "";
  if (/[zZ]$|[+-]\d\d:\d\d$/.test(local)) return local;
  return `${local}${offset}`;
}
