import { NextResponse } from "next/server";
import WebSocket from "ws";

// Force the Node.js runtime (not Edge) — the `ws` package needs Node sockets.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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

    function unknown(reason: string) {
      return NextResponse.json(
        { status: "unknown", reason, lastUpdated: new Date().toISOString() },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    function done(response: NextResponse) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      try { ws.close(); } catch {}
      resolve(response);
    }

    const timeout = setTimeout(() => done(unknown("timeout")), 9000);

    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          // AISstream requires APIKey + a BoundingBoxes covering the whole
          // globe so the MMSI filter can find the vessel anywhere on earth.
          APIKey: apiKey,
          BoundingBoxes: [[[-90, -180], [90, 180]]],
          FiltersShipMMSI: [mmsi],
          FilterMessageTypes: ["PositionReport"],
        })
      );
    });

    ws.on("message", (data: WebSocket.RawData) => {
      try {
        const msg: AISPositionMessage & { error?: string } = JSON.parse(data.toString());

        // AISstream replies with an `error` field if the subscription is
        // rejected (bad key / malformed request) — surface it directly.
        if (msg.error) {
          done(unknown(`ais_error: ${msg.error}`));
          return;
        }

        if (msg.MessageType !== "PositionReport") return;

        const pos = msg.Message.PositionReport;
        const meta = msg.MetaData;
        if (!pos) return;

        const lat = meta?.latitude ?? pos.Latitude;
        const lon = meta?.longitude ?? pos.Longitude;

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
    });

    // Capture the real error string so we stop guessing at "ws_error".
    ws.on("error", (err: Error) => {
      done(unknown(`ws_error: ${err?.message ?? "unknown"}`));
    });

    ws.on("close", (code: number, reason: Buffer) => {
      done(unknown(`ws_closed: ${code} ${reason?.toString() || ""}`.trim()));
    });
  });
}
