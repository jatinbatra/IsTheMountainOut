"use client";

import { useState, useEffect, useCallback } from "react";
import { Camera, RefreshCw, ExternalLink, AlertCircle } from "lucide-react";

// Placeholder URL — swap with a real WSDOT or Space Needle cam URL
const WEBCAM_URL = "/api/webcam/usgs-longmire";
const WEBCAM_SOURCE = "https://www.usgs.gov/volcanoes/mount-rainier/webcams";

export default function FeaturedWebcam() {
  const [imgSrc, setImgSrc] = useState(WEBCAM_URL);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refresh = useCallback(() => {
    setRefreshing(true);
    setError(false);
    // Cache-bust by appending timestamp
    setImgSrc(`${WEBCAM_URL}?t=${Date.now()}`);
    setLastRefresh(new Date());
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Auto-refresh every 3 minutes
  useEffect(() => {
    const interval = setInterval(refresh, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const timeAgo = () => {
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    if (diff < 60) return "Just now";
    return `${Math.floor(diff / 60)}m ago`;
  };

  return (
    <div className="glass rounded-3xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-75" />
            </div>
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Live</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div>
            <p className="text-sm font-semibold text-white">Mt. Rainier South Face</p>
            <p className="text-[10px] text-white/30">USGS Longmire Webcam</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/20 font-medium hidden sm:inline">{timeAgo()}</span>
          <button
            onClick={refresh}
            className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            title="Refresh webcam"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white/40 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <a
            href={WEBCAM_SOURCE}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            title="View source"
          >
            <ExternalLink className="w-3.5 h-3.5 text-white/40" />
          </a>
        </div>
      </div>

      {/* Image container */}
      <div className="relative aspect-video bg-black/30">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-white/20" />
            <p className="text-sm text-white/30">Webcam feed unavailable</p>
            <button
              onClick={refresh}
              className="text-xs text-blue-400/60 hover:text-blue-300 transition-colors font-medium"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt="Live view of Mt. Rainier from USGS Longmire webcam"
              className="w-full h-full object-cover"
              onError={() => setError(true)}
            />
            {/* Overlay gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            {/* Camera icon watermark */}
            <div className="absolute bottom-3 left-4 flex items-center gap-2 opacity-60">
              <Camera className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] text-white font-medium">
                USGS Volcanic Monitoring
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
