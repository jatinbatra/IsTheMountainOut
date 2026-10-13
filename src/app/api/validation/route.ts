import { NextRequest, NextResponse } from "next/server";
import { isStorageConfigured } from "@/lib/history";
import { buildValidation, loadReadings } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const days = Math.min(31, Math.max(1, Number(request.nextUrl.searchParams.get("days")) || 7));
  if (!isStorageConfigured()) {
    return NextResponse.json({ storage: "unconfigured" }, { status: 503 });
  }
  try {
    const report = buildValidation(await loadReadings(days), days);
    return NextResponse.json(
      { storage: "ok", ...report },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err) {
    console.error("[validation] failed:", err);
    return NextResponse.json({ storage: "error" }, { status: 500 });
  }
}
