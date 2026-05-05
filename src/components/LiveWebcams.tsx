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
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-medium text-[color:var(--type-1)]">
            Webcams
          </h2>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping opacity-75" />
            </div>
            <span className="text-[10px] text-[color:var(--type-4)]">Auto-refreshes</span>
          </div>
        </div>
      </div>

      {/* Camera selector pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {feeds.map((feed, i) => (
          <button
            key={feed.id}
            onClick={() => setSelectedCam(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap transition-all rounded-full ${
              selectedCam === i
                ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)] font-medium"
                : "bg-[var(--ink-deep)] text-[color:var(--type-3)] hover:text-[color:var(--type-2)]"
            }`}
          >
            <Camera className="w-3 h-3" />
            {feed.name}
          </button>
        ))}
      </div>

      {/* Main webcam display */}
      <div className={`overflow-hidden border border-[var(--rule)] ${expanded ? "fixed inset-4 z-50" : ""}`}>
        <div className={`relative ${expanded ? "h-full" : "aspect-video"} bg-[var(--ink-deep)]`}>
          {loadErrors[currentFeed.id] ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--ink-deep)]">
              <AlertCircle className="w-8 h-8 text-[color:var(--type-4)]" />
              <p className="text-sm text-[color:var(--type-3)]">Camera feed temporarily unavailable</p>
              <button
                onClick={() => refreshImage(currentFeed.id)}
                className="mt-1 px-4 py-2 rounded-lg border border-gray-200 text-xs text-[color:var(--type-3)] hover:border-gray-300 transition-colors"
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
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-b from-black/50 to-transparent pointer-events-auto">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-white/80 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">LIVE</span>
                <span className="text-xs text-white/70 font-medium">{currentFeed.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => refreshImage(currentFeed.id)}
                  className="p-1.5 bg-black/30 backdrop-blur-sm rounded-lg hover:bg-black/50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-white/70 ${refreshing ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1.5 bg-black/30 backdrop-blur-sm rounded-lg hover:bg-black/50 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-white/70" />
                </button>
              </div>
            </div>

            {feeds.length > 1 && (
              <>
                <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-all pointer-events-auto">
                  <ChevronLeft className="w-4 h-4 text-white/80" />
                </button>
                <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm rounded-full hover:bg-black/50 transition-all pointer-events-auto">
                  <ChevronRight className="w-4 h-4 text-white/80" />
                </button>
              </>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 pointer-events-auto">
              <div className="flex items-end justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-white/50" />
                  <span className="text-[10px] text-white/50">{currentFeed.location}</span>
                </div>
                <a
                  href={currentFeed.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {currentFeed.sourceName}
                </a>
              </div>
            </div>
          </div>

          {feeds.length > 1 && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
              {feeds.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCam(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    selectedCam === i
                      ? "bg-[var(--ink-deep)] w-5"
                      : "bg-white/30 w-1.5 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {feeds.map((feed, i) => (
          <button
            key={feed.id}
            onClick={() => setSelectedCam(i)}
            className={`relative overflow-hidden transition-all duration-300 ${
              selectedCam === i
                ? "ring-2 ring-[color:var(--accent)]"
                : "border border-[var(--rule)] hover:border-[var(--rule-strong)]"
            }`}
          >
            <div className="aspect-video bg-[var(--ink-deep)] relative">
              {loadErrors[feed.id] ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-[color:var(--type-4)]" />
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getImageSrc(feed)}
                  alt={feed.name}
                  className={`w-full h-full object-cover ${selectedCam === i ? "" : "opacity-60"} transition-opacity`}
                  onError={() => handleImageError(feed.id)}
                />
              )}
            </div>
            <div className="p-2 bg-[var(--ink-deep)]">
              <span className="text-[10px] text-[color:var(--type-2)] truncate block">{feed.name}</span>
            </div>
          </button>
        ))}
      </div>

      <p className="text-[10px] text-[color:var(--type-4)] text-center">
        Live feeds from USGS Cascades Volcano Observatory and National Park Service
      </p>

      {expanded && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setExpanded(false)}
        />
      )}
    </section>
  );
}
