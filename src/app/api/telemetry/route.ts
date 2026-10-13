import { NextRequest, NextResponse } from "next/server";
import { isStorageConfigured, ptDay } from "@/lib/history";
import { loadReadings, type Reading } from "@/lib/validation";
import { TZ } from "@/lib/time";

export const dynamic = "force-dynamic";

const MAX_DAYS = 31;

const COLUMNS: [string, (r: Reading) => unknown][] = [
  ["ts_utc", (r) => r.ts],
  ["local_time", (r) => new Date(r.ts).toLocaleString("en-US", { timeZone: TZ, hour12: false })],
  ["state", (r) => r.state],
  ["score", (r) => r.score],
  ["cloud_low_pct", (r) => r.signals?.cloudLow],
  ["cloud_mid_pct", (r) => r.signals?.cloudMid],
  ["cloud_high_pct", (r) => r.signals?.cloudHigh],
  ["visibility_m", (r) => r.signals?.visibilityM],
  ["pm25", (r) => r.signals?.pm25],
  ["pm10", (r) => r.signals?.pm10],
  ["humidity_pct", (r) => r.signals?.humidity],
  ["temp_c", (r) => r.signals?.tempC],
  ["wind_kmh", (r) => r.signals?.windKmh],
  ["weather_code", (r) => r.signals?.weatherCode],
  ["is_day", (r) => r.signals?.isDay],
  ["pts_low_clouds", (r) => r.signals?.points.low],
  ["pts_mid_clouds", (r) => r.signals?.points.mid],
  ["pts_high_clouds", (r) => r.signals?.points.high],
  ["pts_visibility", (r) => r.signals?.points.vis],
  ["pts_air_quality", (r) => r.signals?.points.aq],
  ["penalty", (r) => r.signals?.points.penalty],
  ["cloud_ceiling", (r) => r.signals?.points.ceiling],
  ["capped_by", (r) => r.signals?.points.cappedBy],
  ["model_version", (r) => r.signals?.model],
  ["confidence", (r) => r.signals?.confidence],
  ["flags", (r) => r.signals?.flags.join(" ")],
  ["forecast_1h", (r) => r.signals?.forecast.h1],
  ["forecast_3h", (r) => r.signals?.forecast.h3],
  ["forecast_6h", (r) => r.signals?.forecast.h6],
  ["spotters", (r) => r.signals?.spotters],
  ["qa_issues", (r) => r.signals?.qa.join(" ")],
  ["provider_observed_at", (r) => r.signals?.observedAt],
];

function csvCell(v: unknown): string {
  if (v === undefined || v === null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const endDay = /^\d{4}-\d{2}-\d{2}$/.test(params.get("date") ?? "") ? params.get("date")! : ptDay();
  const days = Math.min(MAX_DAYS, Math.max(1, Number(params.get("days")) || 1));
  const format = params.get("format") === "csv" ? "csv" : "json";

  if (!isStorageConfigured()) {
    return NextResponse.json({ storage: "unconfigured", readings: [] }, { status: 503 });
  }

  try {
    const readings = (await loadReadings(days, endDay)).sort((a, b) => a.ts.localeCompare(b.ts));
    if (format === "csv") {
      const lines = [COLUMNS.map(([h]) => h).join(",")];
      for (const r of readings) lines.push(COLUMNS.map(([, get]) => csvCell(get(r))).join(","));
      return new NextResponse(lines.join("\n") + "\n", {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="mountain-telemetry-${endDay}-${days}d.csv"`,
          "Cache-Control": "public, s-maxage=60",
        },
      });
    }
    return NextResponse.json(
      { storage: "ok", endDay, days, count: readings.length, readings },
      { headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  } catch (err) {
    console.error("[telemetry] read failed:", err);
    return NextResponse.json({ storage: "error", readings: [] }, { status: 500 });
  }
}
