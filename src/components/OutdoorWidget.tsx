"use client";

import { useState, useEffect } from "react";
import { Sunset, MapPin, Clock, ChevronRight, Camera } from "lucide-react";

interface Props {
  isVisible: boolean;
  sunset?: string;
}

interface Trail {
  name: string;
  distance: string;
  difficulty: "Easy" | "Moderate";
  highlight: string;
  hasRainierView: boolean;
}

const TRAILS: Trail[] = [
  {
    name: "Discovery Park Loop",
    distance: "2.8 mi",
    difficulty: "Easy",
    highlight: "Lighthouse, Puget Sound views, and clear Rainier sightline from the bluff",
    hasRainierView: true,
  },
  {
    name: "Twin Falls Trail",
    distance: "2.6 mi",
    difficulty: "Easy",
    highlight: "Two waterfalls in old-growth forest along the South Fork Snoqualmie River",
    hasRainierView: false,
  },
  {
    name: "Gold Creek Pond",
    distance: "1.0 mi",
    difficulty: "Easy",
    highlight: "Flat loop around an alpine pond with mountain reflections on calm days",
    hasRainierView: true,
  },
  {
    name: "Rattlesnake Ledge",
    distance: "4.0 mi",
    difficulty: "Moderate",
    highlight: "Panoramic view of Rattlesnake Lake and the Cascades from 2,078 ft",
    hasRainierView: true,
  },
  {
    name: "Franklin Falls",
    distance: "2.0 mi",
    difficulty: "Easy",
    highlight: "70-foot waterfall at the end of a gentle forested trail off I-90",
    hasRainierView: false,
  },
];

function getGoldenHourCountdown(sunset?: string): { hours: number; minutes: number; isPast: boolean; goldenStart: string } | null {
  if (!sunset) return null;

  const now = new Date();
  let sunsetDate: Date;

  if (sunset.includes("T")) {
    sunsetDate = new Date(sunset);
  } else {
    const [h, m] = sunset.split(":").map(Number);
    sunsetDate = new Date();
    sunsetDate.setHours(h, m, 0, 0);
  }

  const goldenStart = new Date(sunsetDate.getTime() - 60 * 60 * 1000);
  const diff = sunsetDate.getTime() - now.getTime();

  if (diff < -30 * 60 * 1000) return { hours: 0, minutes: 0, isPast: true, goldenStart: "" };

  const totalMin = Math.max(0, Math.floor(diff / 60000));
  return {
    hours: Math.floor(totalMin / 60),
    minutes: totalMin % 60,
    isPast: false,
    goldenStart: goldenStart.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
    }),
  };
}

export default function OutdoorWidget({ isVisible, sunset }: Props) {
  const [countdown, setCountdown] = useState(getGoldenHourCountdown(sunset));

  useEffect(() => {
    setCountdown(getGoldenHourCountdown(sunset));
    const interval = setInterval(() => {
      setCountdown(getGoldenHourCountdown(sunset));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [sunset]);

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Golden Hour Countdown */}
      {countdown && !countdown.isPast && (
        <div className="border-t border-[var(--rule)] pt-5 space-y-4">
          <div>
            <p className="ticker text-[color:var(--accent)] mb-1">Golden Hour</p>
            <h3 className="font-display text-base font-medium text-[color:var(--type-1)]">
              Best light for Rainier photography
            </h3>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="font-display text-5xl font-light text-[color:var(--accent)] tabular">
              {countdown.hours}
            </span>
            <span className="text-lg text-[color:var(--accent)]/40 mr-2">h</span>
            <span className="font-display text-5xl font-light text-[color:var(--accent)] tabular">
              {countdown.minutes.toString().padStart(2, "0")}
            </span>
            <span className="text-lg text-[color:var(--accent)]/40">m</span>
          </div>

          <div className="flex items-center gap-4 ticker">
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              <span>Golden hour starts at {countdown.goldenStart}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Sunset in {countdown.hours}h {countdown.minutes}m</span>
            </div>
          </div>
        </div>
      )}

      {countdown?.isPast && (
        <div className="border-t border-[var(--rule)] pt-5 flex items-center gap-3">
          <Sunset className="w-5 h-5 text-[color:var(--type-4)]" />
          <div>
            <p className="text-sm font-display text-[color:var(--type-2)]">Golden hour has passed for today</p>
            <p className="ticker mt-0.5">Check back tomorrow for the next window</p>
          </div>
        </div>
      )}

      {/* Trail Recommendations */}
      <div className="border-t border-[var(--rule)] pt-5 space-y-4">
        <div>
          <p className="ticker mb-1">Trail Recommendations</p>
          <h3 className="font-display text-base font-medium text-[color:var(--type-1)]">
            The mountain is out. Great day to hit the trail.
          </h3>
        </div>

        <div className="space-y-0">
          {TRAILS.map((trail) => (
            <div
              key={trail.name}
              className="group flex items-start gap-3 py-3 border-b border-[var(--rule)] last:border-0"
            >
              <div className="mt-0.5 flex-shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[color:var(--type-4)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-display font-medium text-[color:var(--type-1)]">{trail.name}</span>
                  {trail.hasRainierView && (
                    <span className="ticker text-[color:var(--accent-clear)]">
                      Rainier View
                    </span>
                  )}
                </div>
                <p className="text-xs text-[color:var(--type-3)] mt-0.5 leading-relaxed">{trail.highlight}</p>
                <div className="flex items-center gap-3 mt-1 font-mono text-[10px] text-[color:var(--type-4)]">
                  <span>{trail.distance}</span>
                  <span>·</span>
                  <span className={trail.difficulty === "Easy" ? "text-[color:var(--accent-clear)]/60" : "text-[color:var(--accent)]/60"}>
                    {trail.difficulty}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[color:var(--type-4)] group-hover:text-[color:var(--type-2)] transition-colors mt-1 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
