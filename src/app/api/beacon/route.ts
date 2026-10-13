import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { isStorageConfigured, ptDay } from "@/lib/history";
import { NEIGHBORHOOD_LABELS } from "@/lib/visibility";

const COUNTER_TTL_SECONDS = 120 * 24 * 60 * 60;

export async function POST(request: Request) {
  if (!isStorageConfigured()) return new NextResponse(null, { status: 204 });

  try {
    const body = await request.json().catch(() => ({}));
    const hood = typeof body.hood === "string" && NEIGHBORHOOD_LABELS[body.hood] ? body.hood : "";
    const today = ptDay();

    const viewsKey = `beacon:views:${today}`;
    await kv.incr(viewsKey);
    await kv.expire(viewsKey, COUNTER_TTL_SECONDS);

    if (hood) {
      const hoodKey = `beacon:hoods:${today}:${hood}`;
      await kv.incr(hoodKey);
      await kv.expire(hoodKey, COUNTER_TTL_SECONDS);
    }
  } catch {
    // Non-critical — never fail the user experience
  }

  return new NextResponse(null, { status: 204 });
}
