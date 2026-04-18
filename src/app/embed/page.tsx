import { fetchWeatherData } from "@/lib/weather";
import {
  calculateVisibility,
  getNeighborhoodAdjustedScore,
  NEIGHBORHOOD_LABELS,
} from "@/lib/visibility";

export const revalidate = 900;

export default async function EmbedPage({
  searchParams,
}: {
  searchParams: Promise<{ hood?: string }>;
}) {
  const params = await searchParams;
  const hood = params.hood || "";

  const weather = await fetchWeatherData();
  const visibility = calculateVisibility(weather);

  let score = visibility.score;
  let isVisible = visibility.isVisible;
  const hoodLabel = NEIGHBORHOOD_LABELS[hood];

  if (hood && hoodLabel) {
    score = getNeighborhoodAdjustedScore(visibility.score, hood, weather.humidity);
    isVisible = score >= 50;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://is-the-mountain-out.vercel.app";
  const linkUrl = hood ? `${siteUrl}?hood=${encodeURIComponent(hood)}` : siteUrl;

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#0a0f1a",
          color: "#e2e8f0",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            height: "100px",
            boxSizing: "border-box",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {hoodLabel ? `Mt. Rainier from ${hoodLabel}` : "Is The Mountain Out?"}
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: isVisible ? "#34d399" : "#f87171",
                lineHeight: 1,
                marginTop: 4,
              }}
            >
              {isVisible ? "YES" : "NO"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {score}
              <span style={{ fontSize: 14, color: "#475569", fontWeight: 400 }}>
                /100
              </span>
            </div>
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 10,
                color: "#3b82f6",
                textDecoration: "none",
              }}
            >
              isthemountainout.com &rarr;
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
