import { kv } from "@vercel/kv";
import { predictAlpenglow } from "@/lib/alpenglow";

export interface MountainState {
  score: number;
  isVisible: boolean;
  timestamp: string;
  hiddenSince: string | null; // ISO timestamp when mountain became hidden
}

export interface StateTransition {
  type:
    | "mountain_emerged"
    | "sunset_prime"
    | "golden_hour"
    | "alpenglow_alert"
    | "morning_brief"
    | "weekend_lookahead"
    | "gloom_breaker"
    | "record_visibility"
    | "dawn_patrol"
    | "no_change";
  shouldNotify: boolean;
  message: string;
  score: number;
  hiddenHours?: number;
  alpenglowProbability?: number;
}

export interface EvaluateContext {
  hourlyScored?: { time: string; score: number }[];
  dailyScored?: { date: string; dayLabel: string; score: number }[];
  gloomStreakDays?: number;
  sunrise?: string;
}

const STATE_KEY = "mountain:state";

function cooldownKey(type: string): string {
  return `mountain:cooldown:${type}`;
}

/**
 * Read the current persisted mountain state from KV.
 */
export async function getMountainState(): Promise<MountainState | null> {
  try {
    return await kv.get<MountainState>(STATE_KEY);
  } catch {
    console.warn("[State] KV read failed, returning null");
    return null;
  }
}

/**
 * Write the current mountain state to KV.
 */
export async function saveMountainState(state: MountainState): Promise<void> {
  try {
    await kv.set(STATE_KEY, state);
  } catch (err) {
    console.warn("[State] KV write failed:", err instanceof Error ? err.message : String(err));
  }
}

/**
 * Check if a cooldown is active for a given trigger type.
 */
async function isCooldownActive(type: string): Promise<boolean> {
  try {
    const val = await kv.get(cooldownKey(type));
    return val !== null;
  } catch {
    return false;
  }
}

/**
 * Set a cooldown for a trigger type (4 hours TTL).
 */
async function setCooldown(type: string): Promise<void> {
  try {
    await kv.set(cooldownKey(type), "1", { ex: 4 * 60 * 60 });
  } catch {
    // Non-critical
  }
}

function hourInPT(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: "America/Los_Angeles",
  }).formatToParts(d);
  return parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
}

function dayOfWeekPT(d: Date): number {
  const s = d.toLocaleString("en-US", {
    weekday: "short",
    timeZone: "America/Los_Angeles",
  });
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(s);
}

function datePT(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

function isoWeekPT(d: Date): string {
  const target = new Date(d);
  target.setUTCHours(0, 0, 0, 0);
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

async function alreadySent(key: string, ttlSec: number): Promise<boolean> {
  try {
    const existing = await kv.get(key);
    if (existing) return true;
    await kv.set(key, "1", { ex: ttlSec });
    return false;
  } catch {
    return false;
  }
}

function statusPhrase(score: number): string {
  if (score >= 76) return "OUT";
  if (score >= 41) return "peeking through";
  return "hiding";
}

function describeNextWindow(hourly: { time: string; score: number }[] | undefined): string {
  if (!hourly?.length) return "";
  const now = Date.now();
  const upcoming = hourly.filter((h) => new Date(h.time).getTime() >= now);
  let runStart = -1;
  let runPeak = 0;
  for (let i = 0; i < upcoming.length; i++) {
    if (upcoming[i].score >= 76) {
      if (runStart === -1) runStart = i;
      runPeak = Math.max(runPeak, upcoming[i].score);
    } else if (runStart !== -1) {
      if (i - runStart >= 2) {
        const startHour = new Date(upcoming[runStart].time).toLocaleTimeString("en-US", {
          hour: "numeric",
          timeZone: "America/Los_Angeles",
        });
        const endHour = new Date(upcoming[i].time).toLocaleTimeString("en-US", {
          hour: "numeric",
          timeZone: "America/Los_Angeles",
        });
        return ` Next clear window: ${startHour}–${endHour} (peak ${runPeak}/100).`;
      }
      runStart = -1;
      runPeak = 0;
    }
  }
  return "";
}

/**
 * Evaluate whether a state transition has occurred that warrants a notification.
 *
 * Trigger A (The Reveal): Mountain hidden for >6h, score crosses 70
 * Trigger B (Sunset Prime): Within 90min of sunset, score >80
 * Trigger C (Golden Hour): Score crosses 80 from below
 * Trigger D (Alpenglow): High cirrus + clear low/mid + near sunset = alpenglow likely
 */
export async function evaluateTransition(
  currentScore: number,
  currentIsVisible: boolean,
  sunset: string | undefined,
  previousState: MountainState | null,
  cloudData?: { cloudLow: number; cloudMid: number; cloudHigh: number },
  ctx?: EvaluateContext
): Promise<StateTransition> {
  const now = new Date();

  // --- Trigger D: Alpenglow Alert (highest priority — rare, time-sensitive) ---
  if (sunset && cloudData) {
    const alpenglow = predictAlpenglow(
      cloudData.cloudLow,
      cloudData.cloudMid,
      cloudData.cloudHigh,
      sunset,
      currentScore
    );

    if (alpenglow.isLikely && alpenglow.minutesToSunset > 0 && alpenglow.minutesToSunset <= 45) {
      const onCooldown = await isCooldownActive("alpenglow_alert");
      if (!onCooldown) {
        await setCooldown("alpenglow_alert");
        const sunsetStr = new Date(sunset).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/Los_Angeles",
        });
        return {
          type: "alpenglow_alert",
          shouldNotify: true,
          message: `High probability of Alpenglow tonight (${alpenglow.probability}%). Clear skies + high cirrus = Mt. Rainier could turn pink. Sunset at ${sunsetStr}. Get a camera.`,
          score: currentScore,
          alpenglowProbability: alpenglow.probability,
        };
      }
    }
  }

  // --- Trigger I: Dawn Patrol (30-75min before sunrise, morning looks clear) ---
  if (ctx?.sunrise && ctx.hourlyScored?.length) {
    const sunriseTime = new Date(ctx.sunrise);
    const minsToSunrise = (sunriseTime.getTime() - now.getTime()) / (1000 * 60);
    if (minsToSunrise >= 30 && minsToSunrise <= 75) {
      const sunriseStart = sunriseTime.getTime();
      const windowEnd = sunriseStart + 3 * 60 * 60 * 1000;
      const dawnHours = ctx.hourlyScored.filter((h) => {
        const t = new Date(h.time).getTime();
        return t >= sunriseStart && t <= windowEnd;
      });
      if (dawnHours.length) {
        const peak = Math.max(...dawnHours.map((h) => h.score));
        if (peak >= 70) {
          const sent = await alreadySent(`mountain:dawn:${datePT(now)}`, 20 * 60 * 60);
          if (!sent) {
            const sunriseStr = sunriseTime.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              timeZone: "America/Los_Angeles",
            });
            return {
              type: "dawn_patrol",
              shouldNotify: true,
              message: `Dawn patrol: Mt. Rainier could peak at ${peak}/100 within 3 hrs of sunrise (${sunriseStr}). Set the alarm.`,
              score: currentScore,
            };
          }
        }
      }
    }
  }

  // --- Trigger E: Record Visibility (score crosses ≥95) ---
  if (currentScore >= 95 && previousState && previousState.score < 95) {
    const onCooldown = await isCooldownActive("record_visibility");
    if (!onCooldown) {
      await setCooldown("record_visibility");
      return {
        type: "record_visibility",
        shouldNotify: true,
        message: `Exceptional visibility. Mt. Rainier at ${currentScore}/100. Conditions this good are rare. Drop what you're doing.`,
        score: currentScore,
      };
    }
  }

  // --- Trigger A: Mountain Emerged ---
  if (currentIsVisible && currentScore >= 70) {
    if (previousState && !previousState.isVisible && previousState.hiddenSince) {
      const hiddenSince = new Date(previousState.hiddenSince);
      const hiddenMs = now.getTime() - hiddenSince.getTime();
      const hiddenHours = Math.round(hiddenMs / (1000 * 60 * 60));

      if (hiddenHours >= 6) {
        const onCooldown = await isCooldownActive("mountain_emerged");
        if (!onCooldown) {
          await setCooldown("mountain_emerged");
          return {
            type: "mountain_emerged",
            shouldNotify: true,
            message: `The Mountain is OUT! After ${hiddenHours}+ hours hidden, Mt. Rainier is visible from Seattle. Score: ${currentScore}/100.`,
            score: currentScore,
            hiddenHours,
          };
        }
      }
    }
  }

  // --- Trigger F: Gloom-Breaker (score ≥70 after 3+ day hiding streak) ---
  if (
    currentScore >= 70 &&
    previousState &&
    previousState.score < 70 &&
    (ctx?.gloomStreakDays ?? 0) >= 3
  ) {
    const onCooldown = await isCooldownActive("gloom_breaker");
    if (!onCooldown) {
      await setCooldown("gloom_breaker");
      const days = ctx!.gloomStreakDays!;
      return {
        type: "gloom_breaker",
        shouldNotify: true,
        message: `After ${days} gloomy days, the Mountain is back. ${currentScore}/100. Seattle exhales.`,
        score: currentScore,
      };
    }
  }

  // --- Trigger B: Sunset Prime ---
  if (currentScore >= 80 && sunset) {
    const sunsetTime = new Date(sunset);
    const minsToSunset = (sunsetTime.getTime() - now.getTime()) / (1000 * 60);

    if (minsToSunset > 0 && minsToSunset <= 90) {
      const onCooldown = await isCooldownActive("sunset_prime");
      if (!onCooldown) {
        await setCooldown("sunset_prime");
        return {
          type: "sunset_prime",
          shouldNotify: true,
          message: `Prime sunset viewing tonight! Mt. Rainier is crystal clear with a score of ${currentScore}/100. Sunset in ${Math.round(minsToSunset)} minutes.`,
          score: currentScore,
        };
      }
    }
  }

  // --- Trigger G: Morning Brief (daily 7–8am PT, date-deduped) ---
  {
    const ptHour = hourInPT(now);
    if (ptHour === 7) {
      const sent = await alreadySent(`mountain:brief:${datePT(now)}`, 26 * 60 * 60);
      if (!sent) {
        const phrase = statusPhrase(currentScore);
        const window = describeNextWindow(ctx?.hourlyScored);
        return {
          type: "morning_brief",
          shouldNotify: true,
          message: `Good morning. Mt. Rainier is ${phrase} (${currentScore}/100).${window}`,
          score: currentScore,
        };
      }
    }
  }

  // --- Trigger H: Weekend Look-Ahead (Friday 5pm PT, weekly-deduped) ---
  {
    const ptHour = hourInPT(now);
    const dow = dayOfWeekPT(now);
    if (dow === 5 && ptHour === 17) {
      const sent = await alreadySent(`mountain:weekend:${isoWeekPT(now)}`, 8 * 24 * 60 * 60);
      if (!sent && ctx?.dailyScored?.length) {
        const weekend = ctx.dailyScored.slice(0, 4).filter((d) => {
          const day = new Date(d.date).toLocaleString("en-US", {
            weekday: "short",
            timeZone: "America/Los_Angeles",
          });
          return day === "Sat" || day === "Sun";
        });
        if (weekend.length) {
          const best = weekend.reduce((a, b) => (b.score > a.score ? b : a));
          const verdict =
            best.score >= 76
              ? `${best.dayLabel} looks clear (${best.score}/100).`
              : best.score >= 41
                ? `Mixed weekend. Best shot is ${best.dayLabel} at ${best.score}/100.`
                : `Gloomy weekend ahead. Peak ${best.score}/100 on ${best.dayLabel}.`;
          return {
            type: "weekend_lookahead",
            shouldNotify: true,
            message: `Weekend look-ahead: ${verdict}`,
            score: currentScore,
          };
        }
      }
    }
  }

  // --- Trigger C: Golden Hour — score crosses 80 from below ---
  if (currentScore >= 80 && previousState && previousState.score < 80) {
    const onCooldown = await isCooldownActive("golden_hour");
    if (!onCooldown) {
      await setCooldown("golden_hour");
      return {
        type: "golden_hour",
        shouldNotify: true,
        message: `Mt. Rainier just hit ${currentScore}/100. Crystal clear visibility right now. Get outside!`,
        score: currentScore,
      };
    }
  }

  return {
    type: "no_change",
    shouldNotify: false,
    message: "",
    score: currentScore,
  };
}

/**
 * Build the new state object after evaluation.
 */
export function buildNewState(
  currentScore: number,
  currentIsVisible: boolean,
  previousState: MountainState | null
): MountainState {
  const now = new Date().toISOString();

  // Track when the mountain became hidden
  let hiddenSince = previousState?.hiddenSince ?? null;

  if (!currentIsVisible && (previousState === null || previousState.isVisible)) {
    // Just became hidden
    hiddenSince = now;
  } else if (currentIsVisible) {
    // Mountain is visible, clear hidden tracker
    hiddenSince = null;
  }

  return {
    score: currentScore,
    isVisible: currentIsVisible,
    timestamp: now,
    hiddenSince,
  };
}
