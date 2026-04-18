import { NextResponse } from "next/server";
import { getGlobalStreak } from "@/lib/globalStreak";

export const revalidate = 600;

export async function GET() {
  const streak = await getGlobalStreak();
  return NextResponse.json(
    { streak },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" } },
  );
}
