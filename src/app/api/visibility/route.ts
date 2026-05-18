import { NextRequest, NextResponse } from "next/server";
import { fetchWeatherData } from "@/lib/weather";
import { calculateVisibility } from "@/lib/visibility";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
    const lon = searchParams.get("lon") ? parseFloat(searchParams.get("lon")!) : null;

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Missing latitude and longitude parameters" },
        { status: 400 }
      );
    }

    // For MVP, use the same weather data for all locations
    // Future enhancement: fetch location-specific weather data
    const weather = await fetchWeatherData();
    const visibility = calculateVisibility(weather);

    // Apply distance-based bonus/penalty
    // Locations closer to Mt. Rainier (south) get slightly better visibility
    const rainierLat = 46.8523;
    const rainierLon = -121.7603;
    const distance = Math.sqrt(
      Math.pow(lat - rainierLat, 2) + Math.pow(lon - rainierLon, 2)
    );

    // Distance bonus: decrease score as distance increases (max ~1.5 degrees away)
    const distanceBonus = Math.max(-15, 15 - distance * 10);
    const adjustedScore = Math.max(0, Math.min(100, visibility.score + distanceBonus));

    return NextResponse.json(
      {
        latitude: lat,
        longitude: lon,
        baseScore: visibility.score,
        adjustedScore: Math.round(adjustedScore),
        isVisible: adjustedScore >= 50,
        distance,
        weather: {
          temperature: weather.temperature,
          humidity: weather.humidity,
          cloudLow: weather.currentCloudLow,
          cloudMid: weather.currentCloudMid,
          cloudHigh: weather.currentCloudHigh,
          visibility: weather.visibility,
          pm25: weather.pm25,
        },
      },
      { headers: { "Cache-Control": "max-age=600" } }
    );
  } catch (error) {
    console.error("Failed to fetch location visibility:", error);
    return NextResponse.json(
      { error: "Failed to fetch visibility data" },
      { status: 500 }
    );
  }
}
