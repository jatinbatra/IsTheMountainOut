import { NextRequest, NextResponse } from "next/server";
import { getWeekInfo, submitPick, type Pick } from "@/lib/pool";

const MAX_HANDLE = 24;

export async function POST(req: NextRequest) {
  let body: { userId?: string; handle?: string; picks?: number[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const userId = String(body.userId || "").slice(0, 64);
  const handle = String(body.handle || "anon").slice(0, MAX_HANDLE).replace(/[^\w\-. ]/g, "");
  const picks = Array.isArray(body.picks) ? body.picks : null;

  if (!userId || !picks || picks.length !== 7 || picks.some((n) => typeof n !== "number" || n < 0 || n > 100)) {
    return NextResponse.json({ error: "invalid_picks" }, { status: 400 });
  }

  const week = getWeekInfo();
  if (week.isLocked) {
    return NextResponse.json({ error: "week_locked", week }, { status: 403 });
  }

  const pick: Pick = {
    userId,
    handle: handle || "anon",
    picks: picks.map((n) => Math.round(n)),
    submittedAt: new Date().toISOString(),
  };

  try {
    await submitPick(week.id, pick);
  } catch {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, week, pick });
}
