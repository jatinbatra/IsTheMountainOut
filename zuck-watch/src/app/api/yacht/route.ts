import { NextResponse } from "next/server";
import WebSocket from "ws";

export const revalidate = 0;

interface AISPositionMessage {
  MessageType: string;
  Message: {
    PositionReport?: {
      Latitude: number;
      Longitude: number;
      Sog: number;
      Cog: number;
      TrueHeading: number;
    };
  };
  MetaData?: {
    MMSI: number;
    ShipName: string;
    latitude: number;
    longitude: number;
    time_utc: string;
  };
}

function classifyLocation(lat: number, lon: number): "lake_union" | "seattle" | "away" {
  if (
    lat >= 47.635 && lat <= 47.655 &&
    lon >= -122.345 && lon <= -122.318
  ) return "lake_union";

  if (
    lat >= 47.4 && lat <= 47.85 &&
    lon >= -122.6 && lon <= -122.1
  ) return "seattle";

  return "away";
}

export async function GET() {
  const apiKey = process.env.AISSTREAM_API_KEY;
  const mmsi = process.env.YACHT_MMSI ?? "319008200";

  if (!apiKey) {
    return NextResponse.json(
      { status: "unknown", reason: "no_api_key", lastUpdated: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return new Promise<NextResponse>((resolve) => {
    const timeout = setTimeout(() => {
      try { ws.close(); } catch {}
      resolve(
        NextResponse.json(
          { status: "unknown", reason: "timeout", lastUpdated: new Date().toISOString() },
          { headers: { "Cache-Control": "no-store" } }
        )
      );
    }, 8000);

    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          Apikey: apiKey,
          FiltersShipMMSI: [mmsi],
          FilterMessageTypes: ["PositionReport"],
        })
      );
    });

    ws.on("message", (raw) => {
      try {
        const msg: AISPositionMessage = JSON.parse(raw.toString());
        if (msg.MessageType !== "PositionReport") return;

        const pos = msg.Message.PositionReport;
        const meta = msg.MetaData;
        if (!pos) return;

        const lat = meta?.latitude ?? pos.Latitude;
        const lon = meta?.longitude ?? pos.Longitude;
        const location = classifyLocation(lat, lon);

        clearTimeout(timeout);
        ws.close();

        resolve(
          NextResponse.json(
            {
              status: location,
              lat,
              lon,
              sog: pos.Sog,
              cog: pos.Cog,
              heading: pos.TrueHeading,
              shipName: meta?.ShipName?.trim() ?? "LAETITIA",
              lastUpdated: meta?.time_utc ?? new Date().toISOString(),
            },
            {
              headers: {
                "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
              },
            }
          )
        );
      } catch {}
    });

    ws.on("error", () => {
      clearTimeout(timeout);
      resolve(
        NextResponse.json(
          { status: "unknown", reason: "ws_error", lastUpdated: new Date().toISOString() },
          { headers: { "Cache-Control": "no-store" } }
        )
      );
    });
  });
}
