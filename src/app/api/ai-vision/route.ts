import { NextResponse } from "next/server";

// Decoupled from page.tsx — this runs asynchronously via client-side SWR,
// so a slow Gemini response doesn't block the page's TTFB.

const WEBCAM_URL =
  "https://volcanoes.usgs.gov/observatories/cvo/cams/MOWest_prior.jpg";

export async function GET() {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json(
      { error: "AI Vision not configured" },
      { status: 501 }
    );
  }

  try {
    const imgRes = await fetch(WEBCAM_URL, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: "Webcam image unavailable" },
        { status: 502 }
      );
    }

    const imgBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(imgBuffer).toString("base64");
    const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType, data: base64 } },
                {
                  text: "Is Mt. Rainier clearly visible in this image? Reply with only YES or NO.",
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 10 },
        }),
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!geminiRes.ok) {
      return NextResponse.json(
        { error: "Gemini API error" },
        { status: 502 }
      );
    }

    const result = await geminiRes.json();
    const rawText =
      result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Empty Gemini response" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      isVisible: rawText.toUpperCase().startsWith("YES"),
      raw: rawText,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(
      "[AI Vision]",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json(
      { error: "AI Vision check failed" },
      { status: 502 }
    );
  }
}
