import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { recordDrop, verifyRainierPhoto } from "@/lib/photoDrop";
import { NEIGHBORHOOD_LABELS } from "@/lib/visibility";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Photo Drop storage not configured" },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const image = form.get("image");
  const hoodId = String(form.get("hood") || "").trim();
  const userId = String(form.get("userId") || "").trim();
  const handleRaw = String(form.get("handle") || "").trim();
  const handle = handleRaw ? handleRaw.slice(0, 24).replace(/[^\w\-. ]/g, "") : null;

  if (!(image instanceof Blob)) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }
  if (!hoodId || !NEIGHBORHOOD_LABELS[hoodId]) {
    return NextResponse.json({ error: "Invalid neighborhood" }, { status: 400 });
  }
  if (!userId || userId.length > 64) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }
  if (image.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image exceeds 4MB limit" }, { status: 413 });
  }
  if (!ALLOWED_MIMES.has(image.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP allowed" }, { status: 415 });
  }

  const buffer = Buffer.from(await image.arrayBuffer());

  const { verified, raw } = await verifyRainierPhoto(
    buffer.toString("base64"),
    image.type,
  );

  if (!verified) {
    return NextResponse.json(
      {
        verified: false,
        reason: "Not a clear Mt. Rainier photo. Try again with the mountain in the frame.",
        raw,
      },
      { status: 422 },
    );
  }

  const ext = image.type.split("/")[1] || "jpg";
  const ts = Date.now();
  const path = `photo-drops/${hoodId}/${ts}-${userId.slice(0, 8)}.${ext}`;

  const blob = await put(path, buffer, {
    access: "public",
    contentType: image.type,
    addRandomSuffix: true,
  });

  const drop = await recordDrop({
    url: blob.url,
    hoodId,
    userId,
    handle,
    capturedAt: new Date().toISOString(),
  });

  return NextResponse.json({ verified: true, drop });
}
