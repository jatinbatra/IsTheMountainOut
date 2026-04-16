/**
 * Pure-math lunar phase calculator.
 * No APIs, no dependencies — just date arithmetic.
 *
 * Uses a simplified algorithm based on the synodic month (29.53059 days).
 * The reference new moon is January 6, 2000 at 18:14 UTC.
 */

const SYNODIC_MONTH = 29.53058770576;
const KNOWN_NEW_MOON = new Date("2000-01-06T18:14:00Z").getTime();

export interface LunarPhase {
  /** 0-1 where 0 = new moon, 0.5 = full moon */
  phase: number;
  /** 0-100 illumination percentage */
  illumination: number;
  /** Human-readable phase name */
  name: string;
  /** Emoji representing the phase */
  emoji: string;
}

/**
 * Calculate the current lunar phase from a given date.
 */
export function getLunarPhase(date: Date = new Date()): LunarPhase {
  const daysSinceKnown = (date.getTime() - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
  const lunations = daysSinceKnown / SYNODIC_MONTH;
  const phase = lunations - Math.floor(lunations); // 0-1

  // Illumination: 0 at new/full boundaries, peaks at quarters
  // cos gives us the smooth curve: 0 at new, 1 at full, 0 at new again
  const illumination = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);

  const { name, emoji } = getPhaseInfo(phase);

  return { phase, illumination, name, emoji };
}

function getPhaseInfo(phase: number): { name: string; emoji: string } {
  // 8 standard lunar phases
  if (phase < 0.0625) return { name: "New Moon", emoji: "🌑" };
  if (phase < 0.1875) return { name: "Waxing Crescent", emoji: "🌒" };
  if (phase < 0.3125) return { name: "First Quarter", emoji: "🌓" };
  if (phase < 0.4375) return { name: "Waxing Gibbous", emoji: "🌔" };
  if (phase < 0.5625) return { name: "Full Moon", emoji: "🌕" };
  if (phase < 0.6875) return { name: "Waning Gibbous", emoji: "🌖" };
  if (phase < 0.8125) return { name: "Last Quarter", emoji: "🌗" };
  if (phase < 0.9375) return { name: "Waning Crescent", emoji: "🌘" };
  return { name: "New Moon", emoji: "🌑" };
}
