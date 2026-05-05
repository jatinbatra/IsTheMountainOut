import { NextRequest, NextResponse } from "next/server";
import { fetchWeatherData } from "@/lib/weather";
import { scoreHourForTimeline } from "@/lib/visibility";

interface ForecastHour {
  time: string;
  score: number;
  isVisible: boolean;
  temperature: number;
  cloudLow: number;
  cloudMid: number;
  cloudHigh: number;
  humidity: number;
}

interface BestWindow {
  startTime: string;
  endTime: string;
  peakScore: number;
  peakTime: string;
  durationHours: number;
  description: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hoursStr = searchParams.get("hours") ?? "12";
    const viewpointId = searchParams.get("viewpoint_id");

    const hours = Math.min(24, Math.max(6, parseInt(hoursStr)));

    // Fetch weather data and compute forecast
    const weather = await fetchWeatherData();

    // Get hourly forecast
    const now = new Date();
    const currentHour = now.getHours();
    const forecastHours: ForecastHour[] = weather.hourlyForecast
      .slice(currentHour, currentHour + hours)
      .map((h) => {
        const { score, isVisible } = scoreHourForTimeline(h);
        return {
          time: h.time,
          score,
          isVisible,
          temperature: h.temperature,
          cloudLow: h.cloudLow,
          cloudMid: h.cloudMid,
          cloudHigh: h.cloudHigh,
          humidity: h.humidity,
        };
      });

    // Find best visibility window
    const bestWindow = findBestWindow(forecastHours);

    return NextResponse.json(
      {
        viewpointId: viewpointId || "rainier",
        hours,
        forecast: forecastHours,
        bestWindow,
        lastUpdated: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "max-age=600" } }
    );
  } catch (error) {
    console.error("Failed to fetch forecast:", error);
    return NextResponse.json(
      { error: "Failed to fetch forecast data" },
      { status: 500 }
    );
  }
}

/**
 * Find the best consecutive visibility window in the forecast
 * Looks for 2+ hour stretches where visibility is good
 */
function findBestWindow(hours: ForecastHour[]): BestWindow {
  let bestWindowStart = 0;
  let bestWindowEnd = 0;
  let bestWindowScore = 0;

  let currentStart = 0;
  let currentScore = hours[0]?.score ?? 0;

  for (let i = 1; i < hours.length; i++) {
    const score = hours[i].score;

    // Window continues if visible
    if (score >= 50) {
      currentScore = Math.max(currentScore, score);
      continue;
    }

    // Window ends - check if it's the best so far
    const windowLength = i - currentStart;
    if (windowLength >= 2 && currentScore > bestWindowScore) {
      bestWindowStart = currentStart;
      bestWindowEnd = i - 1;
      bestWindowScore = currentScore;
    }

    currentStart = i + 1;
    currentScore = score;
  }

  // Check final window
  const finalLength = hours.length - currentStart;
  if (finalLength >= 2 && currentScore > bestWindowScore) {
    bestWindowStart = currentStart;
    bestWindowEnd = hours.length - 1;
    bestWindowScore = currentScore;
  }

  // If no 2+ hour window found, just return the best single hour
  if (bestWindowEnd === 0 && bestWindowStart === 0) {
    const best = hours.reduce((prev, curr) =>
      curr.score > prev.score ? curr : prev
    );
    const bestIdx = hours.indexOf(best);
    bestWindowStart = bestIdx;
    bestWindowEnd = bestIdx;
  }

  const startTime = hours[bestWindowStart]?.time ?? "";
  const endTime = hours[bestWindowEnd]?.time ?? "";
  const peakHour = hours
    .slice(bestWindowStart, bestWindowEnd + 1)
    .reduce((prev, curr) => (curr.score > prev.score ? curr : prev));
  const peakTime = peakHour.time;
  const durationHours = bestWindowEnd - bestWindowStart + 1;

  let description = "";
  if (bestWindowScore >= 75) {
    description = "Excellent visibility expected";
  } else if (bestWindowScore >= 60) {
    description = "Good visibility window";
  } else if (bestWindowScore >= 50) {
    description = "Mountain should be visible";
  } else {
    description = "Limited visibility, mountain may be obscured";
  }

  return {
    startTime,
    endTime,
    peakScore: Math.round(bestWindowScore),
    peakTime,
    durationHours,
    description,
  };
}
