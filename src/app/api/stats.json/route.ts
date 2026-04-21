import { NextResponse } from "next/server";
import { getAlmanacStats } from "@/lib/almanac";

export const revalidate = 900;

export async function GET() {
  const stats = await getAlmanacStats();
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
