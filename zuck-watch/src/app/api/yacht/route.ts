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

export async function GET(request: Request) {
  const apiKey = process.env.AISSTREAM_API_KEY?.trim();
  const mmsi = process.env.YACHT_MMSI ?? "538072122";

  // ?debug=1 subscribes to the whole globe with NO vessel filter. If the
  // API key is valid this floods with ship data instantly (proving the key
  // works and isolating the issue to the MMSI filter / vessel transmission).
  const debug = new URL(request.url).searchParams.get("debug") === "1";

  if (!apiKey) {
    return NextResponse.json(
      { status: "unknown", reason: "no_api_key", lastUpdated: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return new Promise<NextResponse>((resolve) => {
    let settled = false;
    let opened = false;
    let sent = false;
    let gotMessage = false;

    // Safe fingerprint of the key Vercel actually loaded (debug mode only).
    // Lets us compare against the aisstream.io dashboard without exposing it.
    const keyInfo = debug && apiKey
      ? {
          keyLen: apiKey.length,
          keyHead: apiKey.slice(0, 4),
          keyTail: apiKey.slice(-4),
          keyHasWhitespace: /\s/.test(apiKey),
          keyHasQuotes: /["']/.test(apiKey),
        }
      : undefined;

    function unknown(reason: string) {
      return NextResponse.json(
        { status: "unknown", reason, ...(keyInfo && { keyInfo }), lastUpdated: new Date().toISOString() },
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
      opened = true;
      const sub: Record<string, unknown> = {
        // AISstream requires APIKey + a BoundingBoxes covering the whole
        // globe so the MMSI filter can find the vessel anywhere on earth.
        APIKey: apiKey,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FilterMessageTypes: ["PositionReport"],
      };
      // In normal mode, narrow to our one vessel. In debug mode, omit the
      // filter so ANY ship's position proves the key/connection works.
      if (!debug) sub.FiltersShipMMSI = [mmsi];
      ws.send(JSON.stringify(sub), (err) => { if (!err) sent = true; });
    });

    ws.on("message", (data: WebSocket.RawData) => {
      try {
        gotMessage = true;
        const text = data.toString();
        const msg: AISPositionMessage & { error?: string } = JSON.parse(text);

        // AISstream replies with an `error` field if the subscription is
        // rejected (bad key / malformed request) — surface it directly.
        if (msg.error) {
          done(unknown(`ais_error: ${msg.error}`));
          return;
        }

        // Debug mode: any message at all means the key + connection work.
        if (debug) {
          done(
            NextResponse.json(
              {
                status: "debug_ok",
                keyWorks: true,
                firstMessageType: msg.MessageType,
                shipName: msg.MetaData?.ShipName?.trim(),
                mmsiSeen: msg.MetaData?.MMSI,
              },
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

    // Lifecycle breadcrumbs so an abnormal close tells us *where* it died:
    // opened=false  -> never connected (Vercel egress / TLS / DNS)
    // opened=true   -> handshake OK; server dropped us after subscribe,
    //                  which almost always means a bad/invalid API key.
    const trace = () => `[opened=${opened},sent=${sent},gotMsg=${gotMessage}]`;

    ws.on("error", (err: Error) => {
      done(unknown(`ws_error: ${err?.message ?? "unknown"} ${trace()}`));
    });

    ws.on("close", (code: number, reason: Buffer) => {
      done(unknown(`ws_closed: ${code} ${reason?.toString() || ""} ${trace()}`.trim()));
    });
  });
}
