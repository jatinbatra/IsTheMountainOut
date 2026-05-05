"use client";

import { useState, useRef, useCallback } from "react";
import { Sun, CloudRain, CloudSnow, CloudFog, Cloud } from "lucide-react";

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
  if (score >= 70) return "bg-[#2d8a4e]";
  if (score >= 50) return "bg-[#d4a843]";
  return "bg-[#c75a3a]/60";
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[color:var(--type-1)]">24-Hour Forecast</h3>
        <span className="text-[10px] text-[color:var(--type-4)]">
          {activeHour !== null ? "Viewing" : "Tap"} to explore
        </span>
      </div>

      {/* Active hour detail */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          activeData ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {activeData && (
          <div className="rounded bg-[var(--ink-deep)] p-3 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = getWeatherIcon(activeData.weatherCode);
                return <Icon className="w-5 h-5 text-[color:var(--type-3)]" />;
              })()}
              <div>
                <p className="text-[10px] text-[color:var(--type-3)] uppercase tracking-wider">
                  {new Date(activeData.time).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "America/Los_Angeles",
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-display text-xl font-light text-[color:var(--type-1)]">
                    {activeData.score}
                  </span>
                  <span className="text-[10px] text-[color:var(--type-4)]">/100</span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      activeData.isVisible
                        ? "bg-[#2d8a4e]/10 text-[#2d8a4e]"
                        : "bg-[var(--ink-deep)] text-[color:var(--type-4)]"
                    }`}
                  >
                    {activeData.isVisible ? "Visible" : "Hidden"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 text-[color:var(--type-3)] font-mono text-[10px] flex-wrap">
              <span>Clouds: {activeData.cloudLow}%</span>
              <span>Temp: {((activeData.temperature * 9) / 5 + 32).toFixed(0)}°F</span>
              <span>Vis: {(activeData.visibility / 1609.34).toFixed(0)} mi</span>
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
                {isCurrent && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)] animate-breathe" />
                  </div>
                )}

                <div
                  className={`w-full rounded-t-sm transition-all duration-150 ${getBarColor(hour.score)} ${
                    isActive
                      ? "opacity-100 scale-x-110"
                      : isCurrent
                        ? "opacity-80"
                        : "opacity-40 hover:opacity-60"
                  }`}
                  style={{ height: `${barHeight}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Threshold line */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-gray-200 pointer-events-none"
          style={{ top: "50%" }}
        >
          <span className="absolute -top-3 right-0 text-[9px] text-[color:var(--type-4)]">
            visible
          </span>
        </div>

        {/* Time labels */}
        <div className="flex justify-between mt-2 font-mono text-[9px] text-[color:var(--type-4)]">
          <span>12am</span>
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
          <span>11pm</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[9px] text-[color:var(--type-4)] pt-1 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#2d8a4e]" /> Visible
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#d4a843]" /> Marginal
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#c75a3a]/60" /> Hidden
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--accent)] animate-breathe" /> Now
        </span>
      </div>
    </div>
  );
}
