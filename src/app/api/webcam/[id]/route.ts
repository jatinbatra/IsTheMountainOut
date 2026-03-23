import { NextResponse } from "next/server";
import { WEBCAM_FEEDS } from "@/lib/webcams";

// Cache webcam images for 3 minutes to be respectful to government servers
const imageCache = new Map<string, { data: ArrayBuffer; timestamp: number; contentType: string }>();
const CACHE_TTL = 3 * 60 * 1000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const feed = WEBCAM_FEEDS.find((f) => f.id === id);

  if (!feed) {
    return NextResponse.json({ error: "Webcam not found" }, { status: 404 });
  }

  // Check cache
  const cached = imageCache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new NextResponse(cached.data, {
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=180",
        "X-Webcam-Source": feed.sourceName,
        "X-Webcam-Cached": "true",
      },
    });
  }

  try {
    const response = await fetch(feed.imageUrl, {
      headers: {
        "User-Agent": "IsTheMountainOut/1.0 (Educational weather project)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Webcam image unavailable", status: response.status },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    const data = await response.arrayBuffer();

    // Cache it
    imageCache.set(id, { data, timestamp: Date.now(), contentType });

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=180",
        "X-Webcam-Source": feed.sourceName,
      },
    });
  } catch (error) {
    console.error(`Failed to fetch webcam ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch webcam image" },
      { status: 502 }
    );
  }
}
