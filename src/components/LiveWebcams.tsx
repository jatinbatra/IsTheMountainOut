"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  ExternalLink,
  MapPin,
  Mountain,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  AlertCircle,
} from "lucide-react";

interface WebcamFeed {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl: string;
  sourceUrl: string;
  sourceName: string;
  direction: string;
  elevation?: number;
  refreshMinutes: number;
}

interface Props {
  feeds: WebcamFeed[];
}

export default function LiveWebcams({ feeds }: Props) {
  const [selectedCam, setSelectedCam] = useState(0);
  const [imageTimestamps, setImageTimestamps] = useState<Record<string, number>>({});
  const [loadErrors, setLoadErrors] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const currentFeed = feeds[selectedCam];

  // Auto-refresh images every 3 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setImageTimestamps((prev) => {
        const next = { ...prev };
        feeds.forEach((f) => {
          next[f.id] = Date.now();
        });
        return next;
      });
      setLoadErrors({});
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [feeds]);

  const refreshImage = useCallback((feedId: string) => {
    setRefreshing(true);
    setLoadErrors((prev) => ({ ...prev, [feedId]: false }));
    setImageTimestamps((prev) => ({ ...prev, [feedId]: Date.now() }));
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleImageError = useCallback((feedId: string) => {
    setLoadErrors((prev) => ({ ...prev, [feedId]: true }));
  }, []);

  const getImageSrc = (feed: WebcamFeed) => {
    const ts = imageTimestamps[feed.id] || Date.now();
    return `/api/webcam/${feed.id}?t=${ts}`;
  };

  const goNext = () => setSelectedCam((prev) => (prev + 1) % feeds.length);
  const goPrev = () => setSelectedCam((prev) => (prev - 1 + feeds.length) % feeds.length);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-semibold text-white">
            Live Mountain Cameras
          </h2>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400/70 uppercase tracking-wider font-medium">
              Live
            </span>
          </div>
        </div>
        <span className="text-xs text-white/30">
          Auto-refreshes every 3 min
        </span>
      </div>

      {/* Camera selector tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {feeds.map((feed, i) => (
          <button
            key={feed.id}
            onClick={() => setSelectedCam(i)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
              selectedCam === i
                ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/10"
            }`}
          >
            <Camera className="w-3 h-3" />
            {feed.name}
          </button>
        ))}
      </div>

      {/* Main webcam display */}
      <div className={`relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 ${expanded ? "fixed inset-4 z-50" : ""}`}>
        {/* Image area */}
        <div className={`relative ${expanded ? "h-full" : "aspect-video"} bg-black`}>
          {loadErrors[currentFeed.id] ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/80">
              <AlertCircle className="w-10 h-10 text-white/20" />
              <p className="text-sm text-white/40">
                Camera feed temporarily unavailable
              </p>
              <p className="text-xs text-white/25 max-w-sm text-center">
                This may happen during maintenance or severe weather. The image
                will auto-retry.
              </p>
              <button
                onClick={() => refreshImage(currentFeed.id)}
                className="mt-2 px-4 py-2 bg-white/10 rounded-lg text-xs text-white/60 hover:bg-white/20 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={`${currentFeed.id}-${imageTimestamps[currentFeed.id]}`}
              src={getImageSrc(currentFeed)}
              alt={`Live webcam: ${currentFeed.name} — ${currentFeed.location}`}
              className={`w-full ${expanded ? "h-full object-contain" : "h-full object-cover"} transition-opacity duration-500`}
              onError={() => handleImageError(currentFeed.id)}
            />
          )}

          {/* Overlay controls */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-400/30 rounded-lg px-2.5 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-red-300">LIVE</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {currentFeed.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refreshImage(currentFeed.id)}
                  className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 transition-colors"
                  title="Refresh image"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-white/60 ${refreshing ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 transition-colors"
                  title={expanded ? "Exit fullscreen" : "Fullscreen"}
                >
                  <Maximize2 className="w-4 h-4 text-white/60" />
                </button>
              </div>
            </div>

            {/* Navigation arrows */}
            {feeds.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors pointer-events-auto"
                >
                  <ChevronLeft className="w-5 h-5 text-white/70" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors pointer-events-auto"
                >
                  <ChevronRight className="w-5 h-5 text-white/70" />
                </button>
              </>
            )}

            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 pointer-events-auto">
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-xs text-white/50">
                      {currentFeed.location}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 line-clamp-2">
                    {currentFeed.description}
                  </p>
                </div>
                <a
                  href={currentFeed.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-400/70 hover:text-blue-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  {currentFeed.sourceName}
                </a>
              </div>
            </div>
          </div>

          {/* Camera index dots */}
          {feeds.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
              {feeds.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCam(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    selectedCam === i
                      ? "bg-white w-4"
                      : "bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Camera details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {feeds.map((feed, i) => (
          <button
            key={feed.id}
            onClick={() => setSelectedCam(i)}
            className={`relative rounded-xl overflow-hidden border transition-all ${
              selectedCam === i
                ? "border-blue-400/40 ring-1 ring-blue-400/20"
                : "border-white/5 hover:border-white/10"
            }`}
          >
            <div className="aspect-video bg-black/40 relative">
              {loadErrors[feed.id] ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white/15" />
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getImageSrc(feed)}
                  alt={feed.name}
                  className="w-full h-full object-cover opacity-70"
                  onError={() => handleImageError(feed.id)}
                />
              )}
              {selectedCam === i && (
                <div className="absolute top-1 left-1 flex items-center gap-1 bg-red-500/30 rounded px-1.5 py-0.5">
                  <div className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[9px] text-red-300 font-medium">LIVE</span>
                </div>
              )}
            </div>
            <div className="p-2 bg-white/[0.03]">
              <div className="flex items-center gap-1">
                <Mountain className="w-3 h-3 text-white/30" />
                <span className="text-xs font-medium text-white/60 truncate">
                  {feed.name}
                </span>
              </div>
              {feed.elevation && (
                <span className="text-[10px] text-white/25">
                  {feed.elevation.toLocaleString()} ft
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-white/20 text-center">
        Live images from USGS Cascades Volcano Observatory and National Park
        Service. Images refresh automatically. Camera availability depends on
        weather and maintenance schedules.
      </p>

      {/* Fullscreen backdrop */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/80 z-40"
          onClick={() => setExpanded(false)}
        />
      )}
    </section>
  );
}
