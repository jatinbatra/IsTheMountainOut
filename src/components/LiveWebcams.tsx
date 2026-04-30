"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Camera,
  RefreshCw,
  ExternalLink,
  MapPin,
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
    return `${feed.imageUrl}?t=${ts}`;
  };

  const goNext = () => setSelectedCam((prev) => (prev + 1) % feeds.length);
  const goPrev = () => setSelectedCam((prev) => (prev - 1 + feeds.length) % feeds.length);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-medium text-[color:var(--type-1)]">
            Live Cameras
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-[color:var(--accent)] animate-ping opacity-75" />
            </div>
            <span className="ticker">
              Auto-refreshes every 3 min
            </span>
          </div>
        </div>
      </div>

      {/* Camera selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {feeds.map((feed, i) => (
          <button
            key={feed.id}
            onClick={() => setSelectedCam(i)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs whitespace-nowrap transition-all font-mono tracking-wide ${
              selectedCam === i
                ? "bg-[color:var(--accent)]/[0.1] text-[color:var(--accent)] border border-[color:var(--accent)]/25"
                : "border border-[var(--rule)] text-[color:var(--type-4)] hover:text-[color:var(--type-2)] hover:border-[var(--rule-strong)]"
            }`}
          >
            <Camera className="w-3 h-3" />
            {feed.name}
          </button>
        ))}
      </div>

      {/* Main webcam display */}
      <div className={`relative overflow-hidden ring-1 ring-[var(--rule-strong)] bg-[var(--ink-deep)] ${expanded ? "fixed inset-4 z-50" : ""}`}>
        <div className={`relative ${expanded ? "h-full" : "aspect-video"} bg-[var(--ink-deep)]`}>
          {loadErrors[currentFeed.id] ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <AlertCircle className="w-8 h-8 text-[color:var(--type-4)]" />
              <p className="text-sm text-[color:var(--type-3)]">
                Camera feed temporarily unavailable
              </p>
              <p className="text-xs text-[color:var(--type-4)] max-w-sm text-center">
                This may happen during maintenance or severe weather.
              </p>
              <button
                onClick={() => refreshImage(currentFeed.id)}
                className="mt-1 px-5 py-2 border border-[var(--rule)] text-xs text-[color:var(--type-3)] hover:border-[var(--rule-strong)] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={`${currentFeed.id}-${imageTimestamps[currentFeed.id]}`}
              src={getImageSrc(currentFeed)}
              alt={`Live webcam: ${currentFeed.name}, ${currentFeed.location}`}
              className={`w-full ${expanded ? "h-full object-contain" : "h-full object-cover"} transition-opacity duration-500`}
              onError={() => handleImageError(currentFeed.id)}
            />
          )}

          {/* Overlay controls */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[color:var(--accent)]/20 ring-1 ring-[color:var(--accent)]/25 backdrop-blur-md px-2.5 py-1">
                  <div className="relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)]" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-[color:var(--accent)] animate-ping opacity-75" />
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-[color:var(--accent)]">LIVE</span>
                </div>
                <span className="text-sm font-display font-medium text-[color:var(--type-1)] drop-shadow-lg">
                  {currentFeed.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refreshImage(currentFeed.id)}
                  className="p-2 bg-black/30 backdrop-blur-md hover:bg-black/50 transition-colors ring-1 ring-[var(--rule)]"
                  title="Refresh image"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-[color:var(--type-3)] ${refreshing ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-2 bg-black/30 backdrop-blur-md hover:bg-black/50 transition-colors ring-1 ring-[var(--rule)]"
                  title={expanded ? "Exit fullscreen" : "Fullscreen"}
                >
                  <Maximize2 className="w-4 h-4 text-[color:var(--type-3)]" />
                </button>
              </div>
            </div>

            {/* Navigation arrows */}
            {feeds.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/30 backdrop-blur-md hover:bg-black/50 transition-all ring-1 ring-[var(--rule)] pointer-events-auto"
                >
                  <ChevronLeft className="w-5 h-5 text-[color:var(--type-2)]" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/30 backdrop-blur-md hover:bg-black/50 transition-all ring-1 ring-[var(--rule)] pointer-events-auto"
                >
                  <ChevronRight className="w-5 h-5 text-[color:var(--type-2)]" />
                </button>
              </>
            )}

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-12 pointer-events-auto">
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-[color:var(--type-3)]" />
                    <span className="ticker text-[color:var(--type-3)]">
                      {currentFeed.location}
                    </span>
                  </div>
                  <p className="text-sm text-[color:var(--type-2)] line-clamp-2 font-display font-light">
                    {currentFeed.description}
                  </p>
                </div>
                <a
                  href={currentFeed.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 ticker text-[color:var(--accent)] hover:text-[color:var(--type-1)] transition-colors whitespace-nowrap shrink-0"
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
                      ? "bg-[color:var(--type-1)] w-6"
                      : "bg-[color:var(--type-4)] w-1.5 hover:bg-[color:var(--type-3)]"
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
            className={`relative overflow-hidden transition-all duration-300 ${
              selectedCam === i
                ? "ring-1 ring-[color:var(--accent)]/40"
                : "ring-1 ring-[var(--rule)] hover:ring-[var(--rule-strong)]"
            }`}
          >
            <div className="aspect-video bg-[var(--ink-deep)] relative">
              {loadErrors[feed.id] ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-[color:var(--type-4)]" />
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
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-[color:var(--accent)]/25 backdrop-blur-sm px-1.5 py-0.5">
                  <div className="relative">
                    <div className="w-1 h-1 rounded-full bg-[color:var(--accent)]" />
                    <div className="absolute inset-0 w-1 h-1 rounded-full bg-[color:var(--accent)] animate-ping opacity-75" />
                  </div>
                  <span className="font-mono text-[9px] text-[color:var(--accent)] font-semibold">LIVE</span>
                </div>
              )}
            </div>
            <div className="p-2.5 bg-[color:var(--type-1)]/[0.02]">
              <div className="flex items-center gap-1.5">
                <Camera className="w-3 h-3 text-[color:var(--type-4)]" />
                <span className="font-mono text-xs text-[color:var(--type-3)] truncate">
                  {feed.name}
                </span>
              </div>
              {feed.elevation && (
                <span className="font-mono text-[10px] text-[color:var(--type-4)] tabular">
                  {feed.elevation.toLocaleString()} ft
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <p className="ticker text-center">
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
