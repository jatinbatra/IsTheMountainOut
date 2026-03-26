import { NextRequest, NextResponse } from "next/server";

/**
 * AI Vision-based mountain visibility check using Google Gemini (free tier).
 *
 * Usage:
 *   POST /api/check-visibility
 *   Body: { imageUrl: string } or FormData with "image" file
 *
 * Environment variables needed:
 *   GEMINI_API_KEY — your Google AI Studio API key (free)
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY not configured",
          hint: "Get a free API key at https://ai.google.dev/ and set GEMINI_API_KEY in your Vercel environment variables.",
        },
        { status: 500 }
      );
    }

    let base64Data: string | null = null;
    let mimeType = "image/jpeg";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No image file provided" }, { status: 400 });
      }
      const buffer = await file.arrayBuffer();
      base64Data = Buffer.from(buffer).toString("base64");
      mimeType = file.type || "image/jpeg";
    } else {
      const body = await request.json();
      const { imageUrl } = body;
      if (!imageUrl) {
        return NextResponse.json({ error: "No imageUrl provided" }, { status: 400 });
      }
      const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: `Failed to fetch image: ${imageResponse.status}` },
          { status: 502 }
        );
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      base64Data = Buffer.from(imageBuffer).toString("base64");
      mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: "Is Mt. Rainier clearly visible in this image? Reply with only YES or NO." },
            ],
          }],
          generationConfig: { maxOutputTokens: 10 },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      return NextResponse.json(
        { error: "Gemini API request failed", status: geminiRes.status, detail: errBody },
        { status: 502 }
      );
    }

    const result = await geminiRes.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    const isVisible = rawText.toUpperCase().startsWith("YES");

    return NextResponse.json({
      isVisible,
      raw: rawText,
      model: "gemini-2.0-flash",
      timestamp: new Date().toISOString(),
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
