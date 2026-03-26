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

  // Optional: AI Vision check via Google Gemini (free tier)
  let aiVision: MountainData["aiVision"] = undefined;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const webcamUrl = "https://volcanoes.usgs.gov/observatories/cvo/cams/MOWest_prior.jpg";
      const imgRes = await fetch(webcamUrl, { signal: AbortSignal.timeout(10000) });
      if (imgRes.ok) {
        const imgBuffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(imgBuffer).toString("base64");
        const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inlineData: { mimeType, data: base64 } },
                  { text: "Is Mt. Rainier clearly visible in this image? Reply with only YES or NO." },
                ],
              }],
              generationConfig: { maxOutputTokens: 10 },
            }),
            signal: AbortSignal.timeout(30000),
          }
        );

        if (geminiRes.ok) {
          const result = await geminiRes.json();
          const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
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
