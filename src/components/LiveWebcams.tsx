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
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 ring-1 ring-red-400/15">
            <Camera className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Live Cameras
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="relative">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping opacity-75" />
              </div>
              <span className="text-[11px] text-white/30 font-medium">
                Auto-refreshes every 3 min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Camera selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {feeds.map((feed, i) => (
          <button
            key={feed.id}
            onClick={() => setSelectedCam(i)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all font-medium ${
              selectedCam === i
                ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/25"
                : "glass text-white/35 hover:text-white/50 hover:bg-white/[0.06]"
            }`}
          >
            <Camera className="w-3 h-3" />
            {feed.name}
          </button>
        ))}
      </div>

      {/* Main webcam display */}
      <div className={`relative rounded-3xl overflow-hidden ring-1 ring-white/[0.08] bg-black/40 ${expanded ? "fixed inset-4 z-50 rounded-3xl" : ""}`}>
        <div className={`relative ${expanded ? "h-full" : "aspect-video"} bg-black`}>
          {loadErrors[currentFeed.id] ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/80">
              <div className="p-4 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]">
                <AlertCircle className="w-8 h-8 text-white/15" />
              </div>
              <p className="text-sm text-white/35 font-medium">
                Camera feed temporarily unavailable
              </p>
              <p className="text-xs text-white/20 max-w-sm text-center">
                This may happen during maintenance or severe weather.
              </p>
              <button
                onClick={() => refreshImage(currentFeed.id)}
                className="mt-1 px-5 py-2 glass rounded-xl text-xs text-white/50 hover:bg-white/[0.08] transition-colors font-medium"
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
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-red-500/20 ring-1 ring-red-400/25 backdrop-blur-md rounded-lg px-2.5 py-1">
                  <div className="relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-red-400 animate-ping opacity-75" />
                  </div>
                  <span className="text-[11px] font-semibold text-red-300">LIVE</span>
                </div>
                <span className="text-sm font-semibold text-white drop-shadow-lg">
                  {currentFeed.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refreshImage(currentFeed.id)}
                  className="p-2 rounded-xl bg-black/30 backdrop-blur-md hover:bg-black/50 transition-colors ring-1 ring-white/10"
                  title="Refresh image"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-white/60 ${refreshing ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-2 rounded-xl bg-black/30 backdrop-blur-md hover:bg-black/50 transition-colors ring-1 ring-white/10"
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-black/30 backdrop-blur-md hover:bg-black/50 transition-all ring-1 ring-white/10 pointer-events-auto hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5 text-white/70" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-black/30 backdrop-blur-md hover:bg-black/50 transition-all ring-1 ring-white/10 pointer-events-auto hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5 text-white/70" />
                </button>
              </>
            )}

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-12 pointer-events-auto">
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-xs text-white/40 font-medium">
                      {currentFeed.location}
                    </span>
                  </div>
                  <p className="text-sm text-white/60 line-clamp-2">
                    {currentFeed.description}
                  </p>
                </div>
                <a
                  href={currentFeed.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-400/60 hover:text-blue-300 transition-colors whitespace-nowrap shrink-0 font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  {currentFeed.sourceName}
                </a>
              </div>
            </div>
          </div>

          {/* Camera dots */}
          {feeds.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
              {feeds.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCam(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    selectedCam === i
                      ? "bg-white w-6"
                      : "bg-white/25 w-1.5 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {feeds.map((feed, i) => (
          <button
            key={feed.id}
            onClick={() => setSelectedCam(i)}
            className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
              selectedCam === i
                ? "ring-2 ring-blue-400/40 scale-[1.02]"
                : "ring-1 ring-white/[0.06] hover:ring-white/[0.12] hover:scale-[1.01]"
            }`}
          >
            <div className="aspect-video bg-black/40 relative">
              {loadErrors[feed.id] ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white/10" />
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getImageSrc(feed)}
                  alt={feed.name}
                  className={`w-full h-full object-cover ${selectedCam === i ? "opacity-90" : "opacity-60"} transition-opacity`}
                  onError={() => handleImageError(feed.id)}
                />
              )}
              {selectedCam === i && (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-red-500/25 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                  <div className="relative">
                    <div className="w-1 h-1 rounded-full bg-red-400" />
                    <div className="absolute inset-0 w-1 h-1 rounded-full bg-red-400 animate-ping opacity-75" />
                  </div>
                  <span className="text-[9px] text-red-300 font-semibold">LIVE</span>
                </div>
              )}
            </div>
            <div className="p-2.5 bg-white/[0.02]">
              <div className="flex items-center gap-1.5">
                <Mountain className="w-3 h-3 text-white/25" />
                <span className="text-xs font-medium text-white/50 truncate">
                  {feed.name}
                </span>
              </div>
              {feed.elevation && (
                <span className="text-[10px] text-white/20 font-medium">
                  {feed.elevation.toLocaleString()} ft
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-white/15 text-center font-medium">
        Live feeds from USGS Cascades Volcano Observatory and National Park Service
      </p>

      {/* Fullscreen backdrop */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-40"
          onClick={() => setExpanded(false)}
        />
      )}
    </section>
  );
}
