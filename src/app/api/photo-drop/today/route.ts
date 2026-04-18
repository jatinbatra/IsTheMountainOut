import { NextResponse } from "next/server";
import { getAllCrownsToday, getFeedToday } from "@/lib/photoDrop";

export const revalidate = 60;

export async function GET() {
  const [crowns, feed] = await Promise.all([getAllCrownsToday(), getFeedToday()]);
  return NextResponse.json(
    { crowns, feed },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
