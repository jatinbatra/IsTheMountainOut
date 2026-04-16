"use client";

import { useState, useEffect, useRef } from "react";

export interface AmbientColors {
  dominant: string;
  secondary: string;
  accent: string;
}

const DEFAULT_COLORS: AmbientColors = {
  dominant: "rgba(56, 100, 220, 0.08)",
  secondary: "rgba(120, 50, 200, 0.06)",
  accent: "rgba(34, 197, 94, 0.06)",
};

/**
 * Extract dominant colors from an image URL using canvas sampling.
 * Returns CSS-ready rgba strings for use in ambient gradients.
 *
 * Uses k-means-lite: samples pixels, buckets them, picks top 3.
 * Falls back to default colors on any error (CORS, load fail, etc).
 */
export function useAmbientColor(imageUrl: string | null): AmbientColors {
  const [colors, setColors] = useState<AmbientColors>(DEFAULT_COLORS);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!imageUrl) return;
    if (typeof window === "undefined") return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
        }
        const canvas = canvasRef.current;
        // Sample at low res for speed
        const w = 64;
        const h = 64;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;

        const buckets = extractTopColors(data, 3);

        if (buckets.length >= 3) {
          setColors({
            dominant: `rgba(${buckets[0].join(",")}, 0.10)`,
            secondary: `rgba(${buckets[1].join(",")}, 0.07)`,
            accent: `rgba(${buckets[2].join(",")}, 0.05)`,
          });
        } else if (buckets.length >= 1) {
          setColors({
            dominant: `rgba(${buckets[0].join(",")}, 0.10)`,
            secondary: DEFAULT_COLORS.secondary,
            accent: DEFAULT_COLORS.accent,
          });
        }
      } catch {
        // Canvas tainted by CORS or other error — use defaults
      }
    };

    img.onerror = () => {
      // Silent fail — keep default colors
    };

    img.src = imageUrl;
  }, [imageUrl]);

  return colors;
}

/**
 * Simple color extraction: sample pixels, quantize to buckets,
 * return top N by frequency. Ignores very dark/very bright pixels.
 */
function extractTopColors(data: Uint8ClampedArray, count: number): number[][] {
  const bucketSize = 32; // Quantize to 8 levels per channel
  const freq = new Map<string, { rgb: number[]; count: number }>();

  for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Skip very dark (shadows) and very bright (sky wash) pixels
    const brightness = (r + g + b) / 3;
    if (brightness < 30 || brightness > 230) continue;

    // Quantize
    const qr = Math.floor(r / bucketSize) * bucketSize;
    const qg = Math.floor(g / bucketSize) * bucketSize;
    const qb = Math.floor(b / bucketSize) * bucketSize;
    const key = `${qr},${qg},${qb}`;

    const existing = freq.get(key);
    if (existing) {
      existing.count++;
    } else {
      freq.set(key, { rgb: [qr, qg, qb], count: 1 });
    }
  }

  return Array.from(freq.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, count)
    .map((b) => b.rgb);
}
