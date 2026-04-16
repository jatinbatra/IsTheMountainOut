"use client";

import { useState, useRef, useCallback } from "react";
import useSWR from "swr";
import { Camera, X, Loader2, Clock } from "lucide-react";
import { NEIGHBORHOOD_LABELS } from "@/lib/visibility";

interface Props {
  neighborhood: string | null;
}

interface PhotoData {
  url: string;
  neighborhood: string;
  timestamp: number;
  minutesAgo: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function timeAgo(minutes: number): string {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

export default function PhotoDrop({ neighborhood }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const hood = neighborhood || "general";
  const { data, mutate } = useSWR<{ photo: PhotoData | null }>(
    `/api/photos?hood=${encodeURIComponent(hood)}`,
    fetcher,
    { revalidateOnFocus: false, errorRetryCount: 1 }
  );

  const photo = data?.photo ?? null;
  const hoodLabel = neighborhood ? NEIGHBORHOOD_LABELS[neighborhood] : null;

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("photo", file);
      formData.append("neighborhood", hood);

      try {
        const res = await fetch("/api/photos/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setUploadError(body.error || "Upload failed");
        } else {
          mutate(); // refresh the photo
        }
      } catch {
        setUploadError("Upload failed. Try again.");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [hood, mutate]
  );

  return (
    <div className="flex items-center gap-4">
      {/* Existing photo thumbnail */}
      {photo && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="relative group"
          aria-label="View community photo"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-emerald-400/30 ring-offset-2 ring-offset-[#050b18]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={`Mountain view${hoodLabel ? ` from ${hoodLabel}` : ""}`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-emerald-500/20 backdrop-blur-sm rounded-full px-1.5 py-0.5 ring-1 ring-emerald-400/30">
            <Clock className="w-2 h-2 text-emerald-400" />
            <span className="text-[8px] text-emerald-300 font-semibold">
              {timeAgo(photo.minutesAgo)}
            </span>
          </div>
        </button>
      )}

      {/* Expanded photo view */}
      {expanded && photo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setExpanded(false)}>
          <div className="relative max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setExpanded(false)}
              className="absolute -top-3 -right-3 p-2 bg-white/10 backdrop-blur-md rounded-full ring-1 ring-white/20 z-10"
              aria-label="Close photo"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={`Mountain view${hoodLabel ? ` from ${hoodLabel}` : ""}`}
              className="w-full rounded-2xl ring-1 ring-white/10"
            />
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-white/40">
                {hoodLabel || "Community"} &middot; Verified {timeAgo(photo.minutesAgo)}
              </span>
              <span className="text-white/20">Expires in {Math.max(0, 12 - Math.floor(photo.minutesAgo / 60))}h</span>
            </div>
          </div>
        </div>
      )}

      {/* Upload button */}
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all disabled:opacity-50 font-medium"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Camera className="w-3.5 h-3.5" />
          )}
          {uploading ? "Uploading..." : "Drop a Photo"}
        </button>

        {!photo && !uploading && (
          <span className="text-[10px] text-white/20">
            Prove it! Photos expire in 12h.
          </span>
        )}
      </div>

      {uploadError && (
        <span className="text-[10px] text-red-400/60">{uploadError}</span>
      )}
    </div>
  );
}
