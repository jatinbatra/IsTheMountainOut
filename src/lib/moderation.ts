/**
 * Gemini 2.0 Flash moderation gate for user-uploaded photos.
 *
 * Rejects images that are not outdoor/mountain/landscape photos.
 * Uses the raw REST API (same pattern as /api/ai-vision) to avoid
 * pulling in the full SDK.
 */

interface ModerationResult {
  allowed: boolean;
  reason: string;
}

/**
 * Moderate a photo buffer using Gemini 2.0 Flash.
 * Returns { allowed: true } for outdoor/landscape images,
 * { allowed: false, reason } for anything else.
 *
 * Gracefully degrades: if Gemini is not configured or fails,
 * the photo is allowed through (fail-open for UX).
 */
export async function moderatePhoto(
  buffer: ArrayBuffer,
  mimeType: string
): Promise<ModerationResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    // Fail-open: no API key means no moderation
    return { allowed: true, reason: "moderation_skipped" };
  }

  try {
    const base64 = Buffer.from(buffer).toString("base64");

    const res = await fetch(
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
                  text: `You are a photo moderation system for a Mt. Rainier visibility app. Users upload photos to prove they can see the mountain.

Analyze this image and respond with EXACTLY one line in this format:
ALLOW - if the image shows an outdoor scene, landscape, skyline, mountain, or nature view
REJECT <reason> - if the image is inappropriate, NSFW, spam, not a photo, or clearly unrelated to an outdoor view

Examples of ALLOW: mountain photos, city skylines, cloud/sky shots, outdoor scenery, even if Mt. Rainier isn't visible
Examples of REJECT: selfies with no scenery, screenshots, memes, text images, indoor photos, inappropriate content`,
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 50 },
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) {
      console.warn("[Moderation] Gemini API error:", res.status);
      return { allowed: true, reason: "moderation_api_error" };
    }

    const result = await res.json();
    const rawText =
      result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!rawText) {
      return { allowed: true, reason: "moderation_empty_response" };
    }

    if (rawText.toUpperCase().startsWith("ALLOW")) {
      return { allowed: true, reason: "approved" };
    }

    if (rawText.toUpperCase().startsWith("REJECT")) {
      const reason = rawText.substring(7).trim() || "Content not allowed";
      return { allowed: false, reason };
    }

    // Ambiguous response — fail-open
    console.warn("[Moderation] Ambiguous response:", rawText);
    return { allowed: true, reason: "moderation_ambiguous" };
  } catch (err) {
    console.warn(
      "[Moderation] Failed:",
      err instanceof Error ? err.message : String(err)
    );
    // Fail-open on errors
    return { allowed: true, reason: "moderation_error" };
  }
}
