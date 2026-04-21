import { NextResponse } from "next/server";
import { getRealtimeBundle } from "@/lib/rainierRealtime";

export const revalidate = 600;

export async function GET() {
  const bundle = await getRealtimeBundle();
  return NextResponse.json(bundle, {
    headers: {
      "Cache-Control": "s-maxage=600, stale-while-revalidate=1800",
    },
  });
}
