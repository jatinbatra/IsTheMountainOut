"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Camera, Crown, Check, Loader2, AlertCircle } from "lucide-react";
import { getUserId, getHandle, setHandle as persistHandle } from "@/lib/identity";
import { NEIGHBORHOOD_LABELS } from "@/lib/visibility";

interface Drop {
  url: string;
  hoodId: string;
  userId: string;
  handle: string | null;
  capturedAt: string;
  isCrown: boolean;
}

interface FeedResponse {
  crowns: Record<string, Drop>;
  feed: Drop[];
}

interface Props {
  neighborhood: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TARGET_MAX_DIM = 1600;
const TARGET_QUALITY = 0.82;

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, TARGET_MAX_DIM / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      TARGET_QUALITY,
    );
  });
}

function formatTimeShort(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}

export default function PhotoDrop({ neighborhood }: Props) {
  const { data, mutate } = useSWR<FeedResponse>("/api/photo-drop/today", fetcher, {
    refreshInterval: 2 * 60 * 1000,
    revalidateOnFocus: false,
  });

  const [state, setState] = useState<"idle" | "uploading" | "verifying" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastDrop, setLastDrop] = useState<Drop | null>(null);
  const [handleInput, setHandleInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setHandleInput(getHandle()));
    return () => cancelAnimationFrame(id);
  }, []);

  const hoodId = neighborhood;
  const hoodCrown = hoodId ? data?.crowns?.[hoodId] : null;
  const recent = data?.feed ?? [];
  const crownCount = Object.keys(data?.crowns ?? {}).length;

  const onFile = useCallback(
    async (file: File) => {
      if (!hoodId) {
        setError("Pick a neighborhood first");
        setState("error");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please choose an image");
        setState("error");
        return;
      }

      setError(null);
      setState("uploading");

      try {
        const compressed = await compressImage(file);
        setState("verifying");

        const fd = new FormData();
        fd.append("image", compressed, "drop.jpg");
        fd.append("hood", hoodId);
        fd.append("userId", getUserId());
        if (handleInput) fd.append("handle", handleInput);

        const res = await fetch("/api/photo-drop/upload", { method: "POST", body: fd });
        const json = await res.json();

        if (!res.ok) {
          setError(json.reason || json.error || "Upload failed");
          setState("error");
          return;
        }

        setLastDrop(json.drop);
        setState("success");
        mutate();
        setTimeout(() => setState("idle"), 4000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setState("error");
      }
    },
    [hoodId, handleInput, mutate],
  );

  const busy = state === "uploading" || state === "verifying";
  const hoodLabel = hoodId ? NEIGHBORHOOD_LABELS[hoodId] ?? hoodId : null;

  return (
    <div className="alpine-card">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Crown className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
          <h2 className="font-medium text-sm text-[color:var(--type-1)]">Photo Drop</h2>
          <p className="text-[10px] text-[color:var(--type-4)]">
            First photo per hood wins the Daily Crown
          </p>
        </div>
        {crownCount > 0 && (
          <span className="font-mono text-[10px] text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full tabular">
            {crownCount} crowned
          </span>
        )}
      </div>

      {hoodCrown && (
        <div className="relative mb-2 overflow-hidden rounded">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hoodCrown.url}
            alt={`${hoodLabel} Daily Crown photo`}
            className="w-full aspect-video object-cover"
            loading="lazy"
          />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/90 text-white font-mono text-[10px] tracking-wider uppercase rounded-full">
            <Crown className="w-3 h-3" />
            DAILY CROWN &middot; {hoodLabel}
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
            <div className="text-xs">
              <div className="font-medium text-white">
                {hoodCrown.handle ? `@${hoodCrown.handle}` : "anon"}
              </div>
              <div className="font-mono text-[10px] text-white/60">
                Verified at {formatTimeShort(hoodCrown.capturedAt)}
              </div>
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wider text-[#6edd8f] border border-[#6edd8f]/30 px-2 py-1 rounded-full">
              <Check className="w-3 h-3" />
              AI-verified
            </span>
          </div>
        </div>
      )}

      <div className="space-y-1 mb-1">
        <p className="text-sm text-[color:var(--type-3)]">
          {hoodCrown
            ? `Crown is claimed in ${hoodLabel}. Drop anyway to make the feed.`
            : hoodId
              ? `Be the first in ${hoodLabel}. Mountain must be clearly visible.`
              : !hoodId
                ? "Pick a neighborhood above to drop a photo."
                : "Claim the Daily Crown for your hood."}
        </p>
        <input
          type="text"
          placeholder="@yourname (optional)"
          value={handleInput}
          onChange={(e) => {
            const v = e.target.value.slice(0, 24).replace(/[^\w\-. ]/g, "");
            setHandleInput(v);
            persistHandle(v);
          }}
          className="w-full px-4 py-2.5 bg-transparent border border-[var(--rule)] text-sm text-[color:var(--type-1)] placeholder:text-[color:var(--type-4)] focus:outline-none focus:border-[color:var(--accent)]"
          maxLength={24}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy || !hoodId}
          className={`w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium uppercase tracking-wider transition-colors ${
            busy
              ? "text-[color:var(--type-4)] cursor-wait border border-[var(--rule)]"
              : state === "success"
                ? "bg-[#2d8a4e]/10 text-[#2d8a4e] border border-[#2d8a4e]/20"
                : !hoodId
                  ? "text-[color:var(--type-4)] cursor-not-allowed border border-[var(--rule)]"
                  : "bg-[color:var(--accent)] text-white hover:opacity-90"
          }`}
        >
          {state === "uploading" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : state === "verifying" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : state === "success" ? (
            <>
              <Check className="w-4 h-4" />
              {lastDrop?.isCrown ? "Crown claimed" : "Drop verified"}
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Drop a photo
            </>
          )}
        </button>
        {state === "error" && error && (
          <div className="flex items-start gap-2 text-sm text-red-500">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <div>
          <p className="text-[10px] text-[color:var(--type-4)] uppercase tracking-wider mb-3">
            Today&apos;s feed
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {recent.slice(0, 12).map((d, i) => (
              <a
                key={`${d.url}-${i}`}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded ring-1 ring-gray-100 bg-[var(--ink-deep)] group"
                title={`${NEIGHBORHOOD_LABELS[d.hoodId] ?? d.hoodId} · ${formatTimeShort(d.capturedAt)}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                {d.isCrown && (
                  <Crown className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-amber-500 drop-shadow" />
                )}
                <div className="absolute inset-x-0 bottom-0 px-1.5 py-1 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl">
                  <div className="font-mono text-[9px] tracking-wider text-white truncate">
                    {NEIGHBORHOOD_LABELS[d.hoodId] ?? d.hoodId}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
