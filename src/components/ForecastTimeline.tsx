"use client";

import { useState, useRef, useCallback } from "react";
import { Clock, Sun, CloudRain, CloudSnow, CloudFog, Cloud } from "lucide-react";

interface HourData {
  time: string;
  score: number;
  isVisible: boolean;
  cloudLow: number;
  cloudMid: number;
  cloudHigh: number;
  temperature: number;
  humidity: number;
  visibility: number;
  weatherCode: number;
}

interface Props {
  hourlyTimeline: HourData[];
  currentScore: number;
}

function getWeatherIcon(code: number) {
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 45 && code <= 48) return CloudFog;
  if (code >= 1 && code <= 3) return Cloud;
  return Sun;
}

function getBarColor(score: number): string {
  if (score >= 70) return "bg-emerald-400";
  if (score >= 50) return "bg-amber-400";
  return "bg-red-400";
}

function getDotColor(score: number): string {
  if (score >= 70) return "bg-emerald-400 shadow-emerald-400/50";
  if (score >= 50) return "bg-amber-400 shadow-amber-400/50";
  return "bg-red-400 shadow-red-400/50";
}

export default function ForecastTimeline({ hourlyTimeline, currentScore }: Props) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentHour = now.getHours();

  const getHourFromEvent = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const hourWidth = rect.width / 24;
      const hour = Math.floor(x / hourWidth);
      return Math.max(0, Math.min(23, hour));
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    const hour = getHourFromEvent(e.clientX);
    if (hour !== null) setSelectedHour(hour);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const hour = getHourFromEvent(e.clientX);
    if (hour !== null) {
      setHoveredHour(hour);
      if (isDragging) setSelectedHour(hour);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const activeHour = selectedHour ?? hoveredHour;
  const activeData = activeHour !== null ? hourlyTimeline[activeHour] : null;

  return (
    <div className="glass rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-violet-500/10">
            <Clock className="w-4 h-4 text-violet-300" />
          </div>
          <h2 className="font-display text-lg font-bold text-white">24-Hour Forecast</h2>
        </div>
        <span className="text-xs text-white/25 font-medium">
          {activeHour !== null ? "Viewing" : "Drag or tap"} to explore
        </span>
      </div>

      {/* Active hour detail card */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          activeData ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {activeData && (
          <div className="glass-strong rounded-2xl p-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = getWeatherIcon(activeData.weatherCode);
                return <Icon className="w-6 h-6 text-white/60" />;
              })()}
              <div>
                <div className="text-xs text-white/35 font-medium">
                  {new Date(activeData.time).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "America/Los_Angeles",
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-bold text-white">
                    {activeData.score}
                  </span>
                  <span className="text-white/25">/100</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      activeData.isVisible
                        ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20"
                        : "bg-red-500/15 text-red-300 ring-1 ring-red-400/20"
                    }`}
                  >
                    {activeData.isVisible ? "Visible" : "Hidden"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 text-xs text-white/40 flex-wrap">
              <span>Clouds: {activeData.cloudLow}% low</span>
              <span>Temp: {((activeData.temperature * 9) / 5 + 32).toFixed(0)}°F</span>
              <span>
                Vis: {(activeData.visibility / 1609.34).toFixed(0)} mi
              </span>
              <span>Humidity: {activeData.humidity}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Timeline bars */}
      <div
        ref={containerRef}
        className="relative cursor-crosshair touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          if (!isDragging) setHoveredHour(null);
        }}
      >
        {/* Bar chart */}
        <div className="flex items-end gap-[2px] h-24">
          {hourlyTimeline.map((hour, i) => {
            const isActive = i === activeHour;
            const isCurrent = i === currentHour;
            const barHeight = Math.max(4, (hour.score / 100) * 100);

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center justify-end h-full relative group"
              >
                {/* Current hour marker */}
                {isCurrent && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50 animate-pulse" />
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`w-full rounded-t-sm transition-all duration-150 ${getBarColor(hour.score)} ${
                    isActive
                      ? "opacity-100 scale-x-110"
                      : isCurrent
                        ? "opacity-80"
                        : "opacity-40 hover:opacity-70"
                  }`}
                  style={{ height: `${barHeight}%` }}
                />

                {/* Visibility threshold line position */}
                {i === 0 && (
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-white/10 pointer-events-none"
                    style={{ bottom: "50%" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Threshold line spanning full width */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-white/10 pointer-events-none"
          style={{ top: "50%" }}
        >
          <span className="absolute -top-3 right-0 text-[9px] text-white/15 font-medium">
            visible
          </span>
        </div>

        {/* Time labels */}
        <div className="flex justify-between mt-2 text-[10px] text-white/20 font-medium">
          <span>12am</span>
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
          <span>11pm</span>
        </div>
      </div>

      {/* Summary dots */}
      <div className="flex items-center gap-1.5 pt-1">
        {hourlyTimeline.map((hour, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
              i === currentHour
                ? `${getDotColor(hour.score)} shadow-sm`
                : i === activeHour
                  ? getBarColor(hour.score) + " opacity-90"
                  : hour.isVisible
                    ? "bg-emerald-500/20"
                    : "bg-red-500/15"
            }`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-white/20 font-medium pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400/60" /> Visible (70+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400/60" /> Marginal (50-69)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400/60" /> Hidden (&lt;50)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Now
        </span>
      </div>
    </div>
  );
}
