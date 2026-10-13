"use client";

import { useState } from "react";
import useSWR from "swr";
import type { Reading, ValidationReport } from "@/lib/validation";

const TZ = "America/Los_Angeles";
const INITIAL_ROWS = 12;

type Storage = "ok" | "unconfigured" | "error";
type TelemetryResponse = { storage: Storage; readings: Reading[]; count?: number };
type ValidationResponse = { storage: Storage } & Partial<ValidationReport>;

async function fetcher<T>(url: string): Promise<T> {
  const r = await fetch(url);
  // 503 = storage not configured: still a valid, displayable answer.
  if (!r.ok && r.status !== 503) throw new Error(`${url} ${r.status}`);
  return r.json();
}

const STATE_COLOR = { out: "var(--accent)", hidden: "var(--accent-pink)", night: "var(--text-tertiary)" } as const;

function codeLabel(code?: number): string {
  if (code == null) return "—";
  if (code === 0) return "Clear";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return `Code ${code}`;
}

function shiftDay(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function dayLabel(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
}

const fmt = (v: number | null | undefined, digits = 0) => (v == null ? "—" : v.toFixed(digits));

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-primary)" }}>
      <p className="text-[9px] uppercase tracking-[0.12em] font-semibold" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="font-display mt-1 leading-none" style={{ fontSize: "1.35rem", color: "var(--text-hero)" }}>{value}</p>
      <p className="text-[10px] mt-1 leading-snug" style={{ color: "var(--text-tertiary)" }}>{sub}</p>
    </div>
  );
}

export default function TelemetryCard() {
  const [today] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: TZ }));
  const [day, setDay] = useState(today);
  const [showAll, setShowAll] = useState(false);

  const { data: validation } = useSWR<ValidationResponse>("/api/validation?days=7", fetcher, { refreshInterval: 10 * 60_000 });
  const { data: telemetry, error, isLoading } = useSWR<TelemetryResponse>(`/api/telemetry?date=${day}`, fetcher, {
    refreshInterval: day === today ? 5 * 60_000 : 0,
  });

  const rows = [...(telemetry?.readings ?? [])].sort((a, b) => b.ts.localeCompare(a.ts));
  const visibleRows = showAll ? rows : rows.slice(0, INITIAL_ROWS);
  const unconfigured = telemetry?.storage === "unconfigured" || validation?.storage === "unconfigured";

  return (
    <section id="section-telemetry" className="dash-card mt-4" aria-labelledby="telemetry-heading">
      <div className="dash-card-header flex items-center justify-between gap-3">
        <h2 id="telemetry-heading" className="text-[10px] font-normal">Signals &amp; Validation</h2>
        <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>every 15 min · Open-Meteo</span>
      </div>

      {unconfigured ? (
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Telemetry storage isn&apos;t connected yet, so signals aren&apos;t being saved. Once Redis/KV is connected,
          every reading&apos;s full signal set is logged and validated here.
        </p>
      ) : (
        <div className="space-y-6">
          {/* ── Validation ── */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>Validation · last 7 days</h3>
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>forecasts checked against what was logged</span>
            </div>
            {validation?.storage === "ok" && validation.forecast ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {validation.forecast.map((h) => (
                  <Tile
                    key={h.horizon}
                    label={`Forecast +${h.horizon}`}
                    value={h.mae == null ? "—" : `±${h.mae}`}
                    sub={
                      h.samples
                        ? `pts avg error · ${h.stateAccuracy ?? "—"}% out/hidden right · n=${h.samples}${h.bias ? ` · ${h.bias > 0 ? "optimistic" : "pessimistic"} ${Math.abs(h.bias)}` : ""}`
                        : "waiting for forecast hours to arrive"
                    }
                  />
                ))}
                <Tile
                  label="Community check"
                  value={validation.community?.agreement == null ? "—" : `${validation.community.agreement}%`}
                  sub={
                    validation.community?.readingsWithSightings
                      ? `model said "out" in ${validation.community.modelSaidOut} of ${validation.community.readingsWithSightings} readings with sightings`
                      : "no “I see it” taps logged yet"
                  }
                />
                <Tile
                  label="Data quality"
                  value={validation.quality?.passRate == null ? "—" : `${validation.quality.passRate}%`}
                  sub={
                    validation.quality?.readingsWithTelemetry
                      ? `${validation.quality.readingsWithIssues} of ${validation.quality.readingsWithTelemetry} readings had input issues · coverage ${validation.coverage?.rate ?? "—"}%`
                      : "no telemetry readings yet"
                  }
                />
              </div>
            ) : (
              <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {validation ? "Validation unavailable right now." : "Loading validation…"}
              </p>
            )}
            {validation?.quality?.latestIssue && (
              <p className="text-[10px] mt-2" style={{ color: "var(--text-tertiary)" }}>
                Latest input issue ({new Date(validation.quality.latestIssue.ts).toLocaleString("en-US", { timeZone: TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}):{" "}
                <span className="font-mono">{validation.quality.latestIssue.issues.join(", ")}</span>
              </p>
            )}
          </div>

          {/* ── Telemetry log ── */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setDay((d) => shiftDay(d, -1)); setShowAll(false); }}
                  className="px-2 py-1 rounded text-[11px] border"
                  style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
                  aria-label="Previous day"
                >
                  ←
                </button>
                <h3 className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Telemetry log · {day === today ? "Today" : dayLabel(day)}
                </h3>
                <button
                  type="button"
                  onClick={() => { setDay((d) => shiftDay(d, 1)); setShowAll(false); }}
                  disabled={day >= today}
                  className="px-2 py-1 rounded text-[11px] border disabled:opacity-30"
                  style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
                  aria-label="Next day"
                >
                  →
                </button>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <a href={`/api/telemetry?date=${day}&format=csv`} style={{ color: "var(--accent-gold)" }}>CSV (day)</a>
                <a href={`/api/telemetry?date=${today}&days=31&format=csv`} style={{ color: "var(--accent-gold)" }}>CSV (31 days)</a>
                <a href={`/api/telemetry?date=${day}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-gold)" }}>JSON</a>
              </div>
            </div>

            {isLoading && !telemetry && <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Loading readings…</p>}
            {(error || telemetry?.storage === "error") && (
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Couldn&apos;t load telemetry right now.</p>
            )}
            {telemetry?.storage === "ok" && rows.length === 0 && (
              <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>No readings logged for this day.</p>
            )}

            {rows.length > 0 && (
              <>
                {/* Horizontal scroll only — overflow-y hidden so it can't trap vertical page scrolling. */}
                <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1" style={{ overscrollBehaviorX: "contain" }}>
                  <table className="w-full text-[10.5px] tabular-nums whitespace-nowrap">
                    <thead>
                      <tr className="text-left" style={{ color: "var(--text-tertiary)" }}>
                        {["Time", "State", "Score", "Low", "Mid", "High", "Vis km", "PM2.5", "Hum", "Temp", "Wind", "Sky", "Points L/M/H/V/AQ", "Fcst +1/+3/+6h", "Seen", "Checks"].map((h) => (
                          <th key={h} className="font-semibold uppercase tracking-wider text-[8.5px] py-1.5 pr-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((r) => {
                        const s = r.signals;
                        return (
                          <tr key={r.ts} className="border-t" style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}>
                            <td className="py-1.5 pr-3" style={{ color: "var(--text-primary)" }}>
                              {new Date(r.ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ })}
                            </td>
                            <td className="pr-3">
                              <span className="inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATE_COLOR[r.state] }} />
                                {r.state}
                              </span>
                            </td>
                            <td className="pr-3 font-semibold" style={{ color: "var(--text-primary)" }}>{r.score}</td>
                            <td className="pr-3">{s ? `${s.cloudLow}%` : "—"}</td>
                            <td className="pr-3">{s ? `${s.cloudMid}%` : "—"}</td>
                            <td className="pr-3">{s ? `${s.cloudHigh}%` : "—"}</td>
                            <td className="pr-3">{s ? fmt(s.visibilityM / 1000, 0) : "—"}</td>
                            <td className="pr-3">{fmt(s?.pm25, 1)}</td>
                            <td className="pr-3">{s ? `${s.humidity}%` : "—"}</td>
                            <td className="pr-3">{s ? `${Math.round(s.tempC * 9 / 5 + 32)}°F` : "—"}</td>
                            <td className="pr-3">{s ? `${Math.round(s.windKmh * 0.621371)} mph` : "—"}</td>
                            <td className="pr-3">{codeLabel(s?.weatherCode)}</td>
                            <td className="pr-3">
                              {s ? `${s.points.low}/${s.points.mid}/${s.points.high}/${s.points.vis}/${s.points.aq}${s.points.penalty ? ` −${s.points.penalty}` : ""}${s.points.cappedBy ? ` · cap ${s.points.ceiling}` : ""}` : "—"}
                            </td>
                            <td className="pr-3">{s ? `${s.forecast.h1 ?? "—"} / ${s.forecast.h3 ?? "—"} / ${s.forecast.h6 ?? "—"}` : "—"}</td>
                            <td className="pr-3">{s ? s.spotters : "—"}</td>
                            <td className="pr-3">
                              {!s ? (
                                <span style={{ color: "var(--text-tertiary)" }}>no telemetry</span>
                              ) : s.qa.length === 0 ? (
                                <span style={{ color: "var(--accent)" }}>✓ passed</span>
                              ) : (
                                <span title={s.qa.join(", ")} style={{ color: "var(--accent-gold)" }}>⚠ {s.qa.length} issue{s.qa.length > 1 ? "s" : ""}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {rows.length > INITIAL_ROWS && (
                  <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    className="mt-2 text-[10px] uppercase tracking-wider font-mono"
                    style={{ color: "var(--accent-gold)" }}
                  >
                    {showAll ? "Show latest only" : `Show all ${rows.length} readings`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
