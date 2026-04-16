import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { kv } from "@vercel/kv";

interface PhotoData {
  url: string;
  neighborhood: string;
  timestamp: number;
  expiresAt: number;
}

export async function GET(request: NextRequest) {
  try {
    const hood = request.nextUrl.searchParams.get("hood");

    if (hood) {
      // Get photo for specific neighborhood
      const raw = await kv.get<string>(`photo:${hood}`);
      if (!raw) {
        return NextResponse.json({ photo: null });
      }
      const photo: PhotoData = typeof raw === "string" ? JSON.parse(raw) : raw;

      // Check expiry (KV TTL handles cleanup, but double-check)
      if (photo.expiresAt < Date.now()) {
        return NextResponse.json({ photo: null });
      }

      const minutesAgo = Math.round((Date.now() - photo.timestamp) / 60000);
      return NextResponse.json({
        photo: { ...photo, minutesAgo },
      });
    }

    // Get all recent photos
    const rawList = await kv.lrange("photos:recent", 0, 9);
    const now = Date.now();
    const photos = rawList
      .map((raw) => {
        const p: PhotoData = typeof raw === "string" ? JSON.parse(raw) : raw;
        return { ...p, minutesAgo: Math.round((now - p.timestamp) / 60000) };
      })
      .filter((p) => p.expiresAt > now);

    return NextResponse.json({ photos });
  } catch (err) {
    console.error("[Photos API]", err);

    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("KV") || msg.includes("not configured")) {
      return NextResponse.json({ photo: null, photos: [] });
    }

    return NextResponse.json({ photo: null, photos: [] });
  }
}
