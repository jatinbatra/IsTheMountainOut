import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

// This route is purely param-driven. No API fetches.
// Crawlers (iMessage, Slack, X) hit this on every link unfurl — if we
// fetched weather data here, a viral share would DDoS the Open-Meteo API.

const NEIGHBORHOOD_LABELS: Record<string, string> = {
  "capitol-hill": "Capitol Hill",
  "queen-anne": "Queen Anne",
  "ballard": "Ballard",
  "fremont": "Fremont",
  "downtown": "Downtown",
  "beacon-hill": "Beacon Hill",
  "west-seattle": "West Seattle",
  "columbia-city": "Columbia City",
  "greenwood": "Greenwood",
  "u-district": "U-District",
  "bellevue": "Bellevue",
  "kirkland": "Kirkland",
  "tacoma": "Tacoma",
  "renton": "Renton",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const isHoodWars = searchParams.get("hoodwars") === "1";

  if (isHoodWars) {
    return renderHoodWarsCard(searchParams);
  }

  const score = Number(searchParams.get("score") || "50");
  const isVisible = searchParams.get("visible") !== "false";
  const hood = searchParams.get("hood") || "";

  const hoodLabel = NEIGHBORHOOD_LABELS[hood];
  const label = isVisible ? "YES" : "NO";
  const subtitle = hoodLabel
    ? `The mountain is ${isVisible ? "out" : "hiding"} from ${hoodLabel}.`
    : `The mountain is ${isVisible ? "out!" : "hiding."}`;
  const bgGradient = isVisible
    ? "linear-gradient(135deg, #030b1a 0%, #064e3b 50%, #0c4a6e 100%)"
    : "linear-gradient(135deg, #07090e 0%, #1e293b 50%, #0f172a 100%)";
  const accentColor = isVisible ? "#34d399" : "#f87171";

  const now = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: bgGradient,
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 300,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          }}
        />

        {/* Question */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase" as const,
            color: "rgba(255,255,255,0.4)",
            marginBottom: 20,
          }}
        >
          {hoodLabel ? `Is the Mountain Out from ${hoodLabel}?` : "Is the Mountain Out?"}
        </div>

        {/* Answer */}
        <div
          style={{
            fontSize: 180,
            fontWeight: 900,
            lineHeight: 0.85,
            color: accentColor,
            letterSpacing: "-0.04em",
          }}
        >
          {label}
        </div>

        {/* Score */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginTop: 24,
          }}
        >
          <span style={{ fontSize: 48, fontWeight: 800, color: "white" }}>
            {score}
          </span>
          <span
            style={{ fontSize: 20, fontWeight: 300, color: "rgba(255,255,255,0.3)" }}
          >
            /100
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 20,
            color: "rgba(255,255,255,0.5)",
            marginTop: 16,
          }}
        >
          {subtitle}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "rgba(255,255,255,0.25)",
            fontSize: 14,
          }}
        >
          <span>isthemountainout.vercel.app</span>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <span>{now} PT</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

function renderHoodWarsCard(searchParams: URLSearchParams) {
  const hood = searchParams.get("hood") || "";
  const label = NEIGHBORHOOD_LABELS[hood] || "Seattle";
  const days = Number(searchParams.get("days") || "0");
  const streak = Number(searchParams.get("streak") || "0");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0b0f1a 0%, #1c1530 45%, #3a1e0d 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          padding: 80,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(251,146,60,0.22), transparent 70%)",
          }}
        />
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.35em",
            textTransform: "uppercase" as const,
            color: "rgba(251,191,36,0.8)",
            marginBottom: 40,
            display: "flex",
          }}
        >
          ⚔  Hood Wars
        </div>
        <div
          style={{
            fontSize: 130,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-0.04em",
            lineHeight: 0.92,
            display: "flex",
          }}
        >
          {label}
        </div>
        <div style={{ display: "flex", gap: 40, marginTop: 50 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
              Out-days
            </div>
            <div style={{ fontSize: 100, fontWeight: 800, color: "#fbbf24", lineHeight: 1 }}>
              {days}
              <span style={{ fontSize: 32, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}> / 30</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
              Streak
            </div>
            <div style={{ fontSize: 100, fontWeight: 800, color: "#fb923c", lineHeight: 1, display: "flex" }}>
              🔥 {streak}
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 80,
            right: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "rgba(255,255,255,0.4)",
            fontSize: 20,
          }}
        >
          <span>isthemountainout.com/hoods/{hood}</span>
          <span style={{ color: "rgba(251,191,36,0.7)", fontWeight: 700 }}>
            Rep {label}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
