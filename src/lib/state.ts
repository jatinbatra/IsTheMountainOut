import { kv } from "@vercel/kv";

export interface MountainState {
  score: number;
  isVisible: boolean;
  timestamp: string;
  hiddenSince: string | null; // ISO timestamp when mountain became hidden
}

export interface StateTransition {
  type: "mountain_emerged" | "sunset_prime" | "no_change";
  shouldNotify: boolean;
  message: string;
  score: number;
  hiddenHours?: number;
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

/**
 * Evaluate whether a state transition has occurred that warrants a notification.
 *
 * Trigger A (The Reveal): Mountain hidden for >6h, score crosses 70
 * Trigger B (Golden Hour): Within 90min of sunset, score >80
 */
export async function evaluateTransition(
  currentScore: number,
  currentIsVisible: boolean,
  sunset: string | undefined,
  previousState: MountainState | null
): Promise<StateTransition> {
  const now = new Date();

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
