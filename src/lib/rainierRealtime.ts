import { DESTINATIONS } from "@/lib/rainierTrips";

export interface DestinationWeather {
  id: string;
  temperature: number | null;
  cloudCover: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
  fetchedAt: string;
}

export interface ParkAlert {
  id: string;
  title: string;
  category: string;
  description: string;
  url?: string;
  lastIndexedDate?: string;
}

export interface RealtimeBundle {
  destinations: Record<string, DestinationWeather>;
  alerts: ParkAlert[];
  alertsAvailable: boolean;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    cloud_cover?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
}

async function fetchDestinationWeather(): Promise<Record<string, DestinationWeather>> {
  const out: Record<string, DestinationWeather> = {};
  const fetchedAt = new Date().toISOString();

  await Promise.all(
    DESTINATIONS.map(async (dest) => {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(dest.lat));
      url.searchParams.set("longitude", String(dest.lon));
      url.searchParams.set(
        "current",
        "temperature_2m,cloud_cover,weather_code,wind_speed_10m"
      );
      url.searchParams.set("temperature_unit", "fahrenheit");
      url.searchParams.set("wind_speed_unit", "mph");
      url.searchParams.set("timezone", "America/Los_Angeles");

      try {
        const res = await fetch(url.toString(), { next: { revalidate: 600 } });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as OpenMeteoResponse;
        const c = json.current;
        out[dest.id] = {
          id: dest.id,
          temperature: c?.temperature_2m ?? null,
          cloudCover: c?.cloud_cover ?? null,
          weatherCode: c?.weather_code ?? null,
          windSpeed: c?.wind_speed_10m ?? null,
          fetchedAt,
        };
      } catch (err) {
        console.warn(`[RainierRealtime] ${dest.id} weather failed:`, err);
        out[dest.id] = {
          id: dest.id,
          temperature: null,
          cloudCover: null,
          weatherCode: null,
          windSpeed: null,
          fetchedAt,
        };
      }
    })
  );

  return out;
}

interface NpsAlertResponse {
  data?: Array<{
    id?: string;
    title?: string;
    category?: string;
    description?: string;
    url?: string;
    lastIndexedDate?: string;
  }>;
}

async function fetchNpsAlerts(): Promise<{ alerts: ParkAlert[]; available: boolean }> {
  const apiKey = process.env.NPS_API_KEY;
  if (!apiKey) return { alerts: [], available: false };

  try {
    const url = new URL("https://developer.nps.gov/api/v1/alerts");
    url.searchParams.set("parkCode", "mora");
    url.searchParams.set("limit", "20");
    url.searchParams.set("api_key", apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 900 } });
    if (!res.ok) {
      console.warn("[RainierRealtime] NPS alerts failed:", res.status);
      return { alerts: [], available: true };
    }
    const json = (await res.json()) as NpsAlertResponse;
    const alerts: ParkAlert[] = (json.data ?? []).map((a, i) => ({
      id: a.id ?? `alert-${i}`,
      title: a.title ?? "Park alert",
      category: a.category ?? "Information",
      description: a.description ?? "",
      url: a.url,
      lastIndexedDate: a.lastIndexedDate,
    }));
    return { alerts, available: true };
  } catch (err) {
    console.warn("[RainierRealtime] NPS alerts threw:", err);
    return { alerts: [], available: true };
  }
}

export async function getRealtimeBundle(): Promise<RealtimeBundle> {
  const [destinations, alertsResult] = await Promise.all([
    fetchDestinationWeather(),
    fetchNpsAlerts(),
  ]);
  return {
    destinations,
    alerts: alertsResult.alerts,
    alertsAvailable: alertsResult.available,
  };
}
