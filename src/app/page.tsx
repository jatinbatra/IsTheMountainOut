import { fetchWeatherData } from "@/lib/weather";
import { calculateVisibility, scoreHourForTimeline } from "@/lib/visibility";
import { rankViewpoints } from "@/lib/viewpoints";
import { getSkyTheme } from "@/lib/sky";
import Dashboard from "@/components/Dashboard";
import type { MountainData } from "@/components/Dashboard";

// ISR: Revalidate every 15 minutes for instant load
export const revalidate = 900;

async function getMountainData(): Promise<MountainData> {
  const weather = await fetchWeatherData();
  const visibility = calculateVisibility(weather);
  const viewpoints = rankViewpoints(
    visibility.score,
    visibility.isVisible,
    weather.visibility / 1609.34,
    weather.pm25
  );
  const skyTheme = getSkyTheme(weather);

  const hourlyTimeline = weather.hourlyForecast.map((h) => {
    const hourScore = scoreHourForTimeline(h);
    return {
      time: h.time,
      score: hourScore.score,
      isVisible: hourScore.isVisible,
      cloudLow: h.cloudLow,
      cloudMid: h.cloudMid,
      cloudHigh: h.cloudHigh,
      temperature: h.temperature,
      humidity: h.humidity,
      visibility: h.visibility,
      weatherCode: h.weatherCode,
    };
  });

  // Optional: AI Vision check if API key is configured
  let aiVision: MountainData["aiVision"] = undefined;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const webcamUrl = "https://volcanoes.usgs.gov/observatories/cvo/cams/MOWest_prior.jpg";
      const imgRes = await fetch(webcamUrl, { signal: AbortSignal.timeout(10000) });
      if (imgRes.ok) {
        const imgBuffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(imgBuffer).toString("base64");
        const mediaType = imgRes.headers.get("content-type") || "image/jpeg";

        const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 10,
            messages: [{
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
                { type: "text", text: "Is Mt. Rainier clearly visible in this image? Reply with only YES or NO." },
              ],
            }],
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (anthropicRes.ok) {
          const result = await anthropicRes.json();
          const rawText = result.content?.[0]?.text?.trim() || "";
          aiVision = {
            isVisible: rawText.toUpperCase().startsWith("YES"),
            raw: rawText,
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch {
      // AI vision is optional — fail silently
    }
  }

  return {
    visibility,
    weather: {
      temperature: weather.temperature,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      weatherCode: weather.weatherCode,
      isDay: weather.isDay,
      cloudLow: weather.currentCloudLow,
      cloudMid: weather.currentCloudMid,
      cloudHigh: weather.currentCloudHigh,
      visibilityMeters: weather.visibility,
      pm25: weather.pm25,
      pm10: weather.pm10,
      sunrise: weather.sunrise,
      sunset: weather.sunset,
    },
    viewpoints,
    skyTheme,
    hourlyTimeline,
    lastUpdated: new Date().toISOString(),
    aiVision,
  };
}

export default async function Home() {
  const data = await getMountainData();
  return <Dashboard initialData={data} />;
}
