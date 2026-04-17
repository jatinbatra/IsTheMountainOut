import { NextResponse } from "next/server";
import { getHoodStandings, WINDOW_DAYS } from "@/lib/hoods";

export const revalidate = 300;

export async function GET() {
  try {
    const standings = await getHoodStandings();
    return NextResponse.json(
      { standings, windowDays: WINDOW_DAYS, generatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "standings_unavailable", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
