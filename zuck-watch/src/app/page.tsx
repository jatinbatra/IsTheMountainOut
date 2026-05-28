"use client";

import { useState, useEffect, useCallback } from "react";

interface YachtData {
  status: "lake_union" | "seattle" | "away" | "unknown";
  lat?: number;
  lon?: number;
  sog?: number;
  cog?: number;
  heading?: number;
  shipName?: string;
  lastUpdated?: string;
  reason?: string;
}

function headingToCompass(deg: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

const LAST_SIGHTING = new Date("2026-05-26T18:00:00-07:00");

const DAILY_INTEL = [
  "Field report: subject believed to be optimizing his rowing algorithm.",
  "Sources confirm: yacht Wi-Fi password is still 'Metaverse2024'.",
  "Asset spotted reviewing Q3 engagement metrics over uni nigiri.",
  "Intel suggests subject challenged a harbor seal to MMA. Outcome: undisclosed.",
  "Unconfirmed: crew asked to A/B test two different sunset viewing angles.",
  "Subject observed manually moderating content from the aft deck.",
  "Report: Launchpad support vessel 'Wingman' ordered oat milk latte from dock.",
  "Field assessment: subject is 6'0\" but lists height as 5'7\" in AIS.",
  "Sources indicate subject benchmarking swim speed against Olympic athletes.",
  "Intel: yacht's destination set to XXX. Our analysts are stumped.",
  "Asset reviewing plans to acquire Lake Union. Current asking price: reasonable.",
  "Unconfirmed: subject gave a 2-hour presentation to crew about the metaverse.",
  "Field note: Launchpad has better Wi-Fi than your apartment.",
  "Report: subject spent morning in VR headset despite being on a boat.",
  "Sources suggest crew was given equity in exchange for sailing duties.",
  "Assessment: subject asked Siri for directions to Lake Union. Siri refused.",
  "Intel: no less than 4 AI assistants running aboard at this time.",
  "Field report: subject observed doing pull-ups on the boom. Classic.",
  "Unconfirmed: yacht playlist is entirely Linkin Park and lo-fi beats.",
  "Sources confirm: there is a foosball table on deck. It is never used.",
  "Report: support vessel Wingman spotted at a Kirkland Costco. Unclear why.",
  "Assessment: subject read 3 books this morning. All were about leadership.",
  "Intel: crew required to submit daily engagement reports to the captain.",
  "Field note: Launchpad has a sauna. Seattle rain irrelevant.",
  "Unconfirmed: subject tried to connect vessel to Starlink. Starlink refused.",
  "Sources indicate onboard chef has a Michelin star. We are not surprised.",
  "Report: subject seen staring at Mount Rainier for exactly 47 minutes.",
  "Assessment: entire crew has matching Patagonia vests. Not a coincidence.",
  "Intel: motion sensor installed on gangplank. Data being analyzed.",
  "Field note: subject greeted dock workers with a firm handshake and eye contact.",
];

function getDailyIntel(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_INTEL[dayOfYear % DAILY_INTEL.length];
}

function getDaysSinceSighting(): number {
  return Math.max(0, Math.floor((Date.now() - LAST_SIGHTING.getTime()) / 86400000));
}

function getFakeViewers(): number {
  // Fluctuates based on time — looks live without any backend
  const seed = Math.floor(Date.now() / 45000);
  const pseudo = Math.sin(seed * 9301 + 49297) * 0.5 + 0.5;
  return Math.floor(pseudo * 38 + 12);
}

function getGawkerCount(): number {
  if (typeof window === "undefined") return 0;
  const today = new Date().toDateString();
  const stored = localStorage.getItem("zw_gawker");
  try {
    const parsed = JSON.parse(stored ?? "{}");
    if (parsed.date !== today) return 0;
    return parsed.count ?? 0;
  } catch { return 0; }
}

function bumpGawkerCount(): number {
  const today = new Date().toDateString();
  const count = getGawkerCount() + 1;
  localStorage.setItem("zw_gawker", JSON.stringify({ date: today, count }));
  return count;
}

export default function Home() {
  const [data, setData] = useState<YachtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [gawkCount, setGawkCount] = useState(0);
  const [viewers, setViewers] = useState(0);
  const [daysSince, setDaysSince] = useState(0);
  const [shared, setShared] = useState(false);

  const fetchYacht = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/yacht", { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setCheckedAt(new Date());
      setGawkCount(bumpGawkerCount());
    } catch {
      setData({ status: "unknown", reason: "fetch_error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setGawkCount(getGawkerCount());
    setViewers(getFakeViewers());
    setDaysSince(getDaysSinceSighting());
    fetchYacht();
    const dataId = setInterval(fetchYacht, 60_000);
    const viewerId = setInterval(() => setViewers(getFakeViewers()), 45_000);
    return () => { clearInterval(dataId); clearInterval(viewerId); };
  }, [fetchYacht]);

  const status = data?.status ?? "unknown";

  const bigText =
    status === "lake_union" ? "ON LAKE UNION" :
    status === "seattle"    ? "IN SEATTLE" :
    status === "away"       ? "NOT HERE" :
    "SIGNAL LOST";

  const bigClass =
    (status === "lake_union" || status === "seattle") ? "status-in" :
    status === "away" ? "status-away" : "status-unknown";

  const subText =
    status === "lake_union"
      ? `spotted on lake union${data?.sog != null ? ` · ${data.sog.toFixed(1)} knots` : ""} · go gawk`
      : status === "seattle"
      ? `somewhere in puget sound${data?.sog != null ? ` · ${data.sog.toFixed(1)} knots` : ""}`
      : status === "away"
      ? "probably buying another island"
      : data?.reason === "no_api_key"
      ? "aisstream api key not configured"
      : "ais transponder off · zuck goes dark";

  const showXxxNote = status === "lake_union" || status === "seattle";
  const isSpotted = status === "lake_union" || status === "seattle";

  const emoji =
    status === "lake_union" ? "🛥️" :
    status === "seattle"    ? "⛵" :
    status === "away"       ? "🏝️" : "📡";

  async function handleShare() {
    const url = window.location.href;
    const text = isSpotted
      ? `🚨 ZUCK'S YACHT IS IN SEATTLE RIGHT NOW 🛥️ ${url}`
      : `tracking zuck's yacht so you don't have to 🛥️ ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "ZUCK WATCH", text, url });
      } else {
        await navigator.clipboard.writeText(text);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {}
  }

  const intel = getDailyIntel();

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem 5rem",
        gap: "1.75rem",
        background: "radial-gradient(ellipse at 50% 0%, #0d1f3c 0%, #050a14 60%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Scanline */}
      <div aria-hidden style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)", pointerEvents: "none", zIndex: 0 }} />

      {/* Live viewer count */}
      <div style={{ position: "fixed", top: "1rem", right: "1rem", fontFamily: "var(--font-inter)", fontSize: "0.65rem", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "0.4rem", zIndex: 2 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
        {viewers} gawking now
      </div>

      {/* Header chip */}
      <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.7rem", letterSpacing: "0.2em", color: "var(--blue)", background: "rgba(96,165,250,0.08)", border: "1px solid var(--border)", padding: "0.4rem 1rem", borderRadius: "999px", textTransform: "uppercase", zIndex: 1 }}>
        🛥️ &nbsp;ZUCK WATCH · LAKE UNION · SEATTLE
      </div>

      {/* Main status */}
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(1.2rem, 5vw, 1.4rem)", letterSpacing: "0.35em", color: "var(--text-dim)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
          IS ZUCK&apos;S YACHT
        </div>

        {loading && !data ? (
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(4rem, 18vw, 9rem)", letterSpacing: "0.05em", color: "var(--text-dim)", lineHeight: 0.9 }}>
            SCANNING...
          </div>
        ) : (
          <div className={bigClass} style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(3.5rem, 16vw, 8rem)", letterSpacing: "0.04em", lineHeight: 0.9, transition: "color 0.5s" }}>
            {bigText}
          </div>
        )}

        <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.85rem", color: "var(--text-dim)", marginTop: "1rem", letterSpacing: "0.05em" }}>
          {loading && data ? "refreshing..." : subText}
        </div>
      </div>

      {/* Yacht emoji */}
      <div className="yacht-float" style={{ fontSize: "3.5rem", zIndex: 1, lineHeight: 1 }} aria-hidden>
        {emoji}
      </div>

      {/* Data card */}
      {data && status !== "unknown" && data.lat != null && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem 1.75rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem 2rem", fontFamily: "var(--font-inter)", fontSize: "0.78rem", zIndex: 1, minWidth: "260px" }}>
          {[
            ["LAT", data.lat?.toFixed(4) + "°N"],
            ["LON", Math.abs(data.lon ?? 0).toFixed(4) + "°W"],
            ["SPEED", data.sog != null ? `${data.sog.toFixed(1)} kn` : "—"],
            ["HEADING", data.heading != null && data.heading < 360 ? headingToCompass(data.heading) : "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: "2px" }}>{label}</div>
              <div style={{ color: "var(--blue)", fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* XXX note */}
      {showXxxNote && (
        <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.7rem", color: "var(--gold-dim)", letterSpacing: "0.06em", background: "rgba(245,200,66,0.05)", border: "1px solid rgba(245,200,66,0.12)", borderRadius: "6px", padding: "0.5rem 1rem", textAlign: "center", zIndex: 1 }}>
          ⚠️ &nbsp;AIS destination set to &ldquo;XXX&rdquo; — deliberately obscured
        </div>
      )}

      {/* Days since sighting */}
      <div style={{ display: "flex", gap: "1rem", zIndex: 1, flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.9rem 1.5rem", textAlign: "center", minWidth: "120px" }}>
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: isSpotted ? "1.8rem" : "2.4rem", color: isSpotted ? "var(--gold)" : "var(--text-dim)", lineHeight: 1, filter: isSpotted ? "drop-shadow(0 0 12px var(--gold))" : "none" }}>
            {isSpotted ? "TODAY" : daysSince}
          </div>
          <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.15em", marginTop: "0.25rem", textTransform: "uppercase" }}>
            {isSpotted ? "spotted!" : "days since sighting"}
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.9rem 1.5rem", textAlign: "center", minWidth: "120px" }}>
          <div style={{ fontFamily: "var(--font-bebas)", fontSize: "2.4rem", color: "var(--blue)", lineHeight: 1 }}>
            {gawkCount}
          </div>
          <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.15em", marginTop: "0.25rem", textTransform: "uppercase" }}>
            your checks today
          </div>
        </div>
      </div>

      {/* Daily intel */}
      <div style={{ background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.1)", borderRadius: "10px", padding: "1rem 1.25rem", maxWidth: "380px", width: "100%", zIndex: 1 }}>
        <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "var(--blue)", marginBottom: "0.5rem", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ background: "var(--blue)", color: "#050a14", padding: "0.1rem 0.4rem", borderRadius: "3px", fontSize: "0.55rem", fontWeight: 700 }}>CLASSIFIED</span>
          daily field report
        </div>
        <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.8rem", color: "var(--text)", lineHeight: 1.6, fontStyle: "italic" }}>
          &ldquo;{intel}&rdquo;
        </div>
        <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.6rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
          — anonymous field operative · updates daily
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", zIndex: 1 }}>
        {checkedAt && (
          <div style={{ fontFamily: "var(--font-inter)", fontSize: "0.7rem", color: "var(--text-dim)", letterSpacing: "0.08em" }}>
            checked at {checkedAt.toLocaleTimeString()} · auto-refreshes every 60s
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={fetchYacht}
            disabled={loading}
            style={{ fontFamily: "var(--font-bebas)", fontSize: "1rem", letterSpacing: "0.2em", color: loading ? "var(--text-dim)" : "var(--blue)", background: "transparent", border: `1px solid ${loading ? "var(--text-dim)" : "var(--border)"}`, borderRadius: "6px", padding: "0.5rem 1.5rem", cursor: loading ? "default" : "pointer", transition: "all 0.2s" }}
          >
            {loading ? "SCANNING..." : "[ CHECK AGAIN ]"}
          </button>

          <button
            onClick={handleShare}
            style={{ fontFamily: "var(--font-bebas)", fontSize: "1rem", letterSpacing: "0.2em", color: shared ? "var(--gold)" : "var(--text-dim)", background: "transparent", border: `1px solid ${shared ? "rgba(245,200,66,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "6px", padding: "0.5rem 1.5rem", cursor: "pointer", transition: "all 0.2s" }}
          >
            {shared ? "[ COPIED ✓ ]" : "[ SHARE ]"}
          </button>
        </div>
      </div>

      {/* Radar */}
      <div aria-hidden style={{ position: "fixed", bottom: "-120px", right: "-120px", width: "320px", height: "320px", borderRadius: "50%", border: "1px solid rgba(96,165,250,0.06)", zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: "20px", borderRadius: "50%", border: "1px solid rgba(96,165,250,0.06)" }} />
        <div style={{ position: "absolute", inset: "60px", borderRadius: "50%", border: "1px solid rgba(96,165,250,0.06)" }} />
        <div className="radar-spin" style={{ position: "absolute", top: "50%", left: "50%", width: "50%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.2))", transformOrigin: "0 50%" }} />
      </div>

      {/* Footer */}
      <footer style={{ position: "fixed", bottom: "1rem", left: 0, right: 0, textAlign: "center", fontFamily: "var(--font-inter)", fontSize: "0.65rem", color: "var(--text-dim)", letterSpacing: "0.1em", zIndex: 1, pointerEvents: "none" }}>
        no cookies · no tracking · we just want to see the boat
      </footer>
    </main>
  );
}
