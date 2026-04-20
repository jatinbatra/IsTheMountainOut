import { kv } from "@vercel/kv";

const TZ = "America/Los_Angeles";

function windowKeyFor(date: Date = new Date()): string {
  const d = new Date(date.toLocaleString("en-US", { timeZone: TZ }));
  const hour = d.getHours();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `spotters:${y}-${m}-${day}:${String(hour).padStart(2, "0")}`;
}

export async function recordSpotter(userId: string): Promise<number> {
  const key = windowKeyFor();
  try {
    await kv.sadd(key, userId);
    await kv.expire(key, 3 * 60 * 60);
    return (await kv.scard(key)) ?? 0;
  } catch (err) {
    console.warn("[Spotters] record failed:", err);
    throw new Error("storage_unavailable");
  }
}

export async function getSpotterCount(): Promise<number> {
  try {
    const prev = new Date();
    prev.setMinutes(prev.getMinutes() - 60);
    const current = windowKeyFor();
    const previous = windowKeyFor(prev);
    const [a, b] = await Promise.all([
      kv.scard(current).catch(() => 0),
      previous !== current ? kv.scard(previous).catch(() => 0) : Promise.resolve(0),
    ]);
    return (a ?? 0) + (b ?? 0);
  } catch {
    return 0;
  }
}

export async function hasSpotted(userId: string): Promise<boolean> {
  try {
    return (await kv.sismember(windowKeyFor(), userId)) === 1;
  } catch {
    return false;
  }
}
