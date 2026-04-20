import { NextRequest, NextResponse } from "next/server";
import { getSpotterCount, hasSpotted, recordSpotter } from "@/lib/spotters";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = String(searchParams.get("userId") || "").slice(0, 64);
  const [count, mine] = await Promise.all([
    getSpotterCount(),
    userId ? hasSpotted(userId) : Promise.resolve(false),
  ]);
  return NextResponse.json({ count, mine });
}

export async function POST(req: NextRequest) {
  let body: { userId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const userId = String(body.userId || "").slice(0, 64);
  if (!userId) return NextResponse.json({ error: "missing_userId" }, { status: 400 });

  try {
    const count = await recordSpotter(userId);
    return NextResponse.json({ ok: true, count, mine: true });
  } catch {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }
}
