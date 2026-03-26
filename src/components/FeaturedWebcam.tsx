"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ExternalLink, AlertCircle } from "lucide-react";

const WEBCAM_URL = "/api/webcam/usgs-longmire";
const WEBCAM_SOURCE = "https://www.usgs.gov/volcanoes/mount-rainier/webcams";

export default function FeaturedWebcam() {
  const [imgSrc, setImgSrc] = useState(WEBCAM_URL);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [lastGoodSrc, setLastGoodSrc] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setError(false);
    setImgSrc(`${WEBCAM_URL}?t=${Date.now()}`);
    setLastRefresh(new Date());
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const timestamp = lastRefresh.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Los_Angeles",
  });

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black/20 ring-1 ring-white/[0.06]">
      {/* Viewfinder frame lines */}
      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-white/20 rounded-tl z-10 pointer-events-none" />
      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-white/20 rounded-tr z-10 pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-white/20 rounded-bl z-10 pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-white/20 rounded-br z-10 pointer-events-none" />

      {/* Top telemetry bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping opacity-75" />
            </div>
            <span className="font-mono text-[10px] font-bold text-red-400 uppercase tracking-widest">REC</span>
          </div>
          <span className="font-mono text-[10px] text-white/50">USGS-LONGMIRE</span>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          <span className="font-mono text-[10px] text-white/40">{timestamp} PT</span>
          <button onClick={refresh} className="p-1 hover:bg-white/10 rounded transition-colors">
            <RefreshCw className={`w-3 h-3 text-white/40 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <a href={WEBCAM_SOURCE} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-white/10 rounded transition-colors">
            <ExternalLink className="w-3 h-3 text-white/40" />
          </a>
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-video">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40">
            <AlertCircle className="w-6 h-6 text-white/15" />
            <p className="font-mono text-xs text-white/25">Feed unavailable</p>
            {lastGoodSrc && (
              <p className="font-mono text-[9px] text-white/15">Showing last known frame</p>
            )}
            <button
              onClick={refresh}
              className="font-mono text-[10px] text-blue-400/50 hover:text-blue-300 transition-colors"
            >
              Retry
            </button>
            {/* Fallback: show last good frame behind error */}
            {lastGoodSrc && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lastGoodSrc} alt="Last known webcam frame" className="absolute inset-0 w-full h-full object-cover opacity-30 -z-10" />
              </>
            )}
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt="Live view of Mt. Rainier from USGS Longmire webcam"
              className="w-full h-full object-cover"
              onLoad={() => setLastGoodSrc(imgSrc)}
              onError={() => setError(true)}
            />
          </>
        )}
      </div>

      {/* Bottom telemetry */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between px-5 py-3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
        <div>
          <p className="font-mono text-[10px] text-white/40">Mt. Rainier South Face</p>
          <p className="font-mono text-[9px] text-white/20">46.75°N 121.81°W | 2,761 ft</p>
        </div>
        <p className="font-mono text-[9px] text-white/15">USGS Volcanic Monitoring</p>
      </div>
    </div>
  );
}
