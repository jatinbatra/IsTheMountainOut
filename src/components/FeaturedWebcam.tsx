"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ExternalLink, AlertCircle } from "lucide-react";

const WEBCAM_URL = "https://volcview.wr.usgs.gov/ashcam-api/images/webcams/rainier-longmire/current.jpeg";
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
    <div className="alpine-card !p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping opacity-75" />
            </div>
            <span className="font-mono text-[10px] font-bold text-red-500 uppercase tracking-widest">Live</span>
          </div>
          <span className="text-xs text-[color:var(--type-3)]">Longmire · Mt. Rainier</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[color:var(--type-4)]">{timestamp} PT</span>
          <button onClick={refresh} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 text-[color:var(--type-4)] ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <a href={WEBCAM_SOURCE} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <ExternalLink className="w-3.5 h-3.5 text-[color:var(--type-4)]" />
          </a>
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-video bg-gray-100">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50">
            <AlertCircle className="w-6 h-6 text-[color:var(--type-4)]" />
            <p className="text-xs text-[color:var(--type-4)]">Feed unavailable</p>
            {lastGoodSrc && (
              <p className="text-[10px] text-[color:var(--type-4)]">Showing last known frame</p>
            )}
            <button
              onClick={refresh}
              className="text-[10px] text-[color:var(--accent)] hover:text-[color:var(--type-1)] transition-colors"
            >
              Retry
            </button>
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

      {/* Footer info */}
      <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between">
        <p className="text-[10px] text-[color:var(--type-3)]">Mt. Rainier South Face · 46.75°N 121.81°W</p>
        <p className="text-[9px] text-[color:var(--type-4)]">USGS Volcanic Monitoring</p>
      </div>
    </div>
  );
}
