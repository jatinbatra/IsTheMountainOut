import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import { moderatePhoto } from "@/lib/moderation";

const PHOTO_TTL = 12 * 60 * 60; // 12 hours in seconds
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;
    const neighborhood = formData.get("neighborhood") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (5MB max)" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Must be an image file" }, { status: 400 });
    }

    // Gemini 2.0 Flash moderation gate — reject non-outdoor/inappropriate images
    const imageBuffer = await file.arrayBuffer();
    const moderation = await moderatePhoto(imageBuffer, file.type);
    if (!moderation.allowed) {
      return NextResponse.json(
        { error: `Photo rejected: ${moderation.reason}` },
        { status: 422 }
      );
    }

    const hood = neighborhood || "general";
    const timestamp = Date.now();
    const filename = `mountain-${hood}-${timestamp}.${file.type.split("/")[1] || "jpg"}`;

    // Upload to Vercel Blob (use the buffer we already read for moderation)
    const blob = await put(filename, imageBuffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });

    // Store reference in KV with 12h TTL
    const photoData = {
      url: blob.url,
      neighborhood: hood,
      timestamp,
      expiresAt: timestamp + PHOTO_TTL * 1000,
    };

    // Store per-neighborhood (latest wins)
    await kv.set(`photo:${hood}`, JSON.stringify(photoData), { ex: PHOTO_TTL });

    // Also push to recent photos list (keep last 10)
    await kv.lpush("photos:recent", JSON.stringify(photoData));
    await kv.ltrim("photos:recent", 0, 9);
    // Set TTL on the list too
    await kv.expire("photos:recent", PHOTO_TTL);

    return NextResponse.json({
      url: blob.url,
      neighborhood: hood,
      expiresIn: "12 hours",
    });
  } catch (err) {
    console.error("[Photo Upload]", err);

    // Graceful degradation when Blob/KV aren't configured
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("BLOB") || msg.includes("KV") || msg.includes("not configured")) {
      return NextResponse.json(
        { error: "Photo uploads not configured yet. Coming soon!" },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
