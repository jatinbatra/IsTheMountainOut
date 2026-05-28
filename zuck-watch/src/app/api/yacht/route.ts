import { NextResponse } from "next/server";

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
  if (lat >= 47.635 && lat <= 47.655 && lon >= -122.345 && lon <= -122.318)
    return "lake_union";
  if (lat >= 47.4 && lat <= 47.85 && lon >= -122.6 && lon <= -122.1)
    return "seattle";
  return "away";
}

export async function GET() {
  const apiKey = process.env.AISSTREAM_API_KEY;
  const mmsi = process.env.YACHT_MMSI ?? "538072122";

  if (!apiKey) {
    return NextResponse.json(
      { status: "unknown", reason: "no_api_key", lastUpdated: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return new Promise<NextResponse>((resolve) => {
    let settled = false;

    function done(response: NextResponse) {
      if (settled) return;
      settled = true;
      try { ws.close(); } catch {}
      resolve(response);
    }

    const timeout = setTimeout(() => {
      done(
        NextResponse.json(
          { status: "unknown", reason: "timeout", lastUpdated: new Date().toISOString() },
          { headers: { "Cache-Control": "no-store" } }
        )
      );
    }, 8000);

    // Use Node.js 22 built-in WebSocket (no external package needed)
    const ws = new (globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket(
      "wss://stream.aisstream.io/v0/stream"
    );

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          // AISstream requires APIKey + a BoundingBoxes covering the
          // whole globe so the MMSI filter can find the vessel anywhere.
          APIKey: apiKey,
          BoundingBoxes: [[[-90, -180], [90, 180]]],
          FiltersShipMMSI: [mmsi],
          FilterMessageTypes: ["PositionReport"],
        })
      );
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const raw =
          typeof event.data === "string" ? event.data : String(event.data);
        const msg: AISPositionMessage & { error?: string } = JSON.parse(raw);

        // AISstream sends an `error` field if the subscription is rejected
        // (e.g. bad API key or malformed request) — surface it instead of
        // blindly waiting for a PositionReport that will never arrive.
        if (msg.error) {
          clearTimeout(timeout);
          done(
            NextResponse.json(
              { status: "unknown", reason: `ais_error: ${msg.error}`, lastUpdated: new Date().toISOString() },
              { headers: { "Cache-Control": "no-store" } }
            )
          );
          return;
        }

        if (msg.MessageType !== "PositionReport") return;

        const pos = msg.Message.PositionReport;
        const meta = msg.MetaData;
        if (!pos) return;

        const lat = meta?.latitude ?? pos.Latitude;
        const lon = meta?.longitude ?? pos.Longitude;

        clearTimeout(timeout);
        done(
          NextResponse.json(
            {
              status: classifyLocation(lat, lon),
              lat,
              lon,
              sog: pos.Sog,
              cog: pos.Cog,
              heading: pos.TrueHeading,
              shipName: meta?.ShipName?.trim() ?? "LAUNCHPAD",
              lastUpdated: meta?.time_utc ?? new Date().toISOString(),
            },
            { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60" } }
          )
        );
      } catch {}
    };

    ws.onerror = () => {
      clearTimeout(timeout);
      done(
        NextResponse.json(
          { status: "unknown", reason: "ws_error", lastUpdated: new Date().toISOString() },
          { headers: { "Cache-Control": "no-store" } }
        )
      );
    };
  });
}
