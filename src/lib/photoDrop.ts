import { kv } from "@vercel/kv";

export interface PhotoDrop {
  url: string;
  hoodId: string;
  userId: string;
  handle: string | null;
  capturedAt: string;
  isCrown: boolean;
}

const FEED_MAX = 50;

function todayPT(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

function crownKey(date: string, hoodId: string): string {
  return `photodrop:crown:${date}:${hoodId}`;
}

function feedKey(date: string): string {
  return `photodrop:feed:${date}`;
}

export async function getCrown(hoodId: string, date = todayPT()): Promise<PhotoDrop | null> {
  try {
    return await kv.get<PhotoDrop>(crownKey(date, hoodId));
  } catch {
    return null;
  }
}

export async function getAllCrownsToday(): Promise<Record<string, PhotoDrop>> {
  const date = todayPT();
  try {
    const keys = await kv.keys(`photodrop:crown:${date}:*`);
    if (!keys?.length) return {};
    const values = await Promise.all(keys.map((k) => kv.get<PhotoDrop>(k)));
    const out: Record<string, PhotoDrop> = {};
    keys.forEach((k, i) => {
      const v = values[i];
      if (!v) return;
      const hoodId = k.split(":").pop()!;
      out[hoodId] = v;
    });
    return out;
  } catch {
    return {};
  }
}

export async function getFeedToday(): Promise<PhotoDrop[]> {
  const date = todayPT();
  try {
    const raw = await kv.get<PhotoDrop[]>(feedKey(date));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export async function recordDrop(drop: Omit<PhotoDrop, "isCrown">): Promise<PhotoDrop> {
  const date = todayPT();
  let isCrown = false;

  try {
    const existing = await kv.get<PhotoDrop>(crownKey(date, drop.hoodId));
    if (!existing) {
      isCrown = true;
      await kv.set(crownKey(date, drop.hoodId), { ...drop, isCrown: true }, {
        ex: 48 * 60 * 60,
      });
    }
  } catch {
    // ignore crown write failure — feed still records
  }

  const final: PhotoDrop = { ...drop, isCrown };

  try {
    const feed = (await kv.get<PhotoDrop[]>(feedKey(date))) || [];
    feed.unshift(final);
    const trimmed = feed.slice(0, FEED_MAX);
    await kv.set(feedKey(date), trimmed, { ex: 48 * 60 * 60 });
  } catch {
    // non-critical
  }

  return final;
}

export async function verifyRainierPhoto(
  imageBase64: string,
  mimeType: string,
): Promise<{ verified: boolean; raw: string }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return { verified: false, raw: "gemini_not_configured" };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType, data: imageBase64 } },
              {
                text: "Is this a real outdoor photograph that clearly shows Mt. Rainier as a large visible mountain in the frame? Reject drawings, memes, screenshots, selfies without mountain, and non-mountain photos. The mountain must be CLEARLY VISIBLE (not obscured by dense clouds). Reply with only YES or NO.",
              },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 10 },
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!res.ok) return { verified: false, raw: `gemini_${res.status}` };

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  return { verified: text.toUpperCase().startsWith("YES"), raw: text };
}
