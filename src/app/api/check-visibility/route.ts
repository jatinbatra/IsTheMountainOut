import { NextRequest, NextResponse } from "next/server";

/**
 * AI Vision-based mountain visibility check.
 *
 * This route accepts a webcam image and sends it to a vision model
 * to determine if Mt. Rainier is visible.
 *
 * Usage:
 *   POST /api/check-visibility
 *   Body: { imageUrl: string } or FormData with "image" file
 *
 * Environment variables needed:
 *   ANTHROPIC_API_KEY — your Anthropic API key
 *
 * The route sends the image to Claude's vision model with a simple
 * YES/NO prompt about mountain visibility.
 */

interface VisionResponse {
  isVisible: boolean;
  raw: string;
  model: string;
  timestamp: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "ANTHROPIC_API_KEY not configured",
          hint: "Set the ANTHROPIC_API_KEY environment variable in your Vercel project settings or .env.local file.",
        },
        { status: 500 }
      );
    }

    // Accept either JSON with imageUrl or FormData with image file
    let imageData: string | null = null;
    let mediaType = "image/jpeg";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get("image") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No image file provided" }, { status: 400 });
      }

      const buffer = await file.arrayBuffer();
      imageData = Buffer.from(buffer).toString("base64");
      mediaType = file.type || "image/jpeg";
    } else {
      // Handle JSON with image URL
      const body = await request.json();
      const { imageUrl } = body;

      if (!imageUrl) {
        return NextResponse.json({ error: "No imageUrl provided" }, { status: 400 });
      }

      // Fetch the image and convert to base64
      const imageResponse = await fetch(imageUrl, {
        signal: AbortSignal.timeout(15000),
      });

      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: `Failed to fetch image: ${imageResponse.status}` },
          { status: 502 }
        );
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      imageData = Buffer.from(imageBuffer).toString("base64");
      mediaType = imageResponse.headers.get("content-type") || "image/jpeg";
    }

    // Send to Claude vision model
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 10,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageData,
                },
              },
              {
                type: "text",
                text: "Is Mt. Rainier clearly visible in this image? Reply with only YES or NO.",
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!anthropicResponse.ok) {
      const errBody = await anthropicResponse.text();
      return NextResponse.json(
        { error: "Vision API request failed", status: anthropicResponse.status, detail: errBody },
        { status: 502 }
      );
    }

    const result = await anthropicResponse.json();
    const rawText = result.content?.[0]?.text?.trim() || "";
    const isVisible = rawText.toUpperCase().startsWith("YES");

    const response: VisionResponse = {
      isVisible,
      raw: rawText,
      model: result.model || "claude-sonnet-4-20250514",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
