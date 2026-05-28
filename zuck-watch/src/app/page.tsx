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

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

export default function Home() {
  const [data, setData] = useState<YachtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const fetchYacht = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/yacht", { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setCheckedAt(new Date());
    } catch {
      setData({ status: "unknown", reason: "fetch_error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYacht();
    const id = setInterval(fetchYacht, 60_000);
    return () => clearInterval(id);
  }, [fetchYacht]);

  const status = data?.status ?? "unknown";

  const bigText =
    status === "lake_union" ? "ON LAKE UNION" :
    status === "seattle"    ? "IN SEATTLE" :
    status === "away"       ? "NOT HERE" :
    "SIGNAL LOST";

  const bigClass =
    status === "lake_union" ? "status-in" :
    status === "seattle"    ? "status-in" :
    status === "away"       ? "status-away" :
    "status-unknown";

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

  const emoji =
    status === "lake_union" ? "🛥️" :
    status === "seattle"    ? "⛵" :
    status === "away"       ? "🏝️" :
    "📡";

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        gap: "2rem",
        background: "radial-gradient(ellipse at 50% 0%, #0d1f3c 0%, #050a14 60%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Scanline effect */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header chip */}
      <div
        style={{
          fontFamily: "var(--font-inter)",
          fontSize: "0.7rem",
          letterSpacing: "0.2em",
          color: "var(--blue)",
          background: "rgba(96,165,250,0.08)",
          border: "1px solid var(--border)",
          padding: "0.4rem 1rem",
          borderRadius: "999px",
          textTransform: "uppercase",
          zIndex: 1,
        }}
      >
        🛥️ &nbsp;ZUCK WATCH · LAKE UNION · SEATTLE
      </div>

      {/* Main status */}
      <div
        style={{
          textAlign: "center",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "clamp(1.2rem, 5vw, 1.4rem)",
            letterSpacing: "0.35em",
            color: "var(--text-dim)",
            textTransform: "uppercase",
            marginBottom: "0.5rem",
          }}
        >
          IS ZUCK&apos;S YACHT
        </div>

        {loading && !data ? (
          <div
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(4rem, 18vw, 9rem)",
              letterSpacing: "0.05em",
              color: "var(--text-dim)",
              lineHeight: 0.9,
            }}
          >
            SCANNING...
          </div>
        ) : (
          <div
            className={bigClass}
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(3.5rem, 16vw, 8rem)",
              letterSpacing: "0.04em",
              lineHeight: 0.9,
              transition: "color 0.5s",
            }}
          >
            {bigText}
          </div>
        )}

        <div
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "0.85rem",
            color: "var(--text-dim)",
            marginTop: "1rem",
            letterSpacing: "0.05em",
          }}
        >
          {loading && data ? "refreshing..." : subText}
        </div>
      </div>

      {/* Yacht emoji */}
      <div
        className="yacht-float"
        style={{ fontSize: "3.5rem", zIndex: 1, lineHeight: 1 }}
        aria-hidden
      >
        {emoji}
      </div>

      {/* Data card */}
      {data && status !== "unknown" && data.lat != null && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1.25rem 1.75rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem 2rem",
            fontFamily: "var(--font-inter)",
            fontSize: "0.78rem",
            zIndex: 1,
            minWidth: "260px",
          }}
        >
          {[
            ["LAT", data.lat?.toFixed(4) + "°N"],
            ["LON", Math.abs(data.lon ?? 0).toFixed(4) + "°W"],
            ["SPEED", data.sog != null ? `${data.sog.toFixed(1)} kn` : "—"],
            ["HEADING", data.heading != null && data.heading < 360 ? headingToCompass(data.heading) : "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: "2px" }}>
                {label}
              </div>
              <div style={{ color: "var(--blue)", fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Last updated + refresh */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
          zIndex: 1,
        }}
      >
        {checkedAt && (
          <div
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "0.7rem",
              color: "var(--text-dim)",
              letterSpacing: "0.08em",
            }}
          >
            checked at {checkedAt.toLocaleTimeString()} · auto-refreshes every 60s
          </div>
        )}

        <button
          onClick={fetchYacht}
          disabled={loading}
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "1rem",
            letterSpacing: "0.2em",
            color: loading ? "var(--text-dim)" : "var(--blue)",
            background: "transparent",
            border: `1px solid ${loading ? "var(--text-dim)" : "var(--border)"}`,
            borderRadius: "6px",
            padding: "0.5rem 1.5rem",
            cursor: loading ? "default" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {loading ? "SCANNING..." : "[ CHECK AGAIN ]"}
        </button>
      </div>

      {/* Radar decoration */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          bottom: "-120px",
          right: "-120px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          border: "1px solid rgba(96,165,250,0.06)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "20px",
            borderRadius: "50%",
            border: "1px solid rgba(96,165,250,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "60px",
            borderRadius: "50%",
            border: "1px solid rgba(96,165,250,0.06)",
          }}
        />
        <div
          className="radar-spin"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "50%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.2))",
            transformOrigin: "0 50%",
          }}
        />
      </div>

      {/* Footer */}
      <footer
        style={{
          position: "fixed",
          bottom: "1rem",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "var(--font-inter)",
          fontSize: "0.65rem",
          color: "var(--text-dim)",
          letterSpacing: "0.1em",
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        no cookies · no tracking · we just want to see the boat
      </footer>
    </main>
  );
}
