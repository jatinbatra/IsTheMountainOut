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

function getGoldenHourCountdown(sunset: string | undefined, now: Date): { hours: number; minutes: number; isPast: boolean; goldenStart: string } | null {
  if (!sunset) return null;

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
  const [prevSunset, setPrevSunset] = useState(sunset);
  const [now, setNow] = useState(() => new Date());
  const [countdown, setCountdown] = useState(() => getGoldenHourCountdown(sunset, now));

  if (sunset !== prevSunset) {
    setPrevSunset(sunset);
    setCountdown(getGoldenHourCountdown(sunset, now));
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const nextNow = new Date();
      setNow(nextNow);
      setCountdown(getGoldenHourCountdown(sunset, nextNow));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [sunset]);

  if (!isVisible) return null;

  return (
    <div className="space-y-1">
      {/* Golden Hour Countdown */}
      {countdown && !countdown.isPast && (
        <div className="alpine-card space-y-0.5">
          <div>
            <p className="text-[10px] text-orange-500 uppercase tracking-wider font-medium mb-1">Golden Hour</p>
            <h3 className="font-medium text-[color:var(--type-1)] text-sm">
              Best light for Rainier photography
            </h3>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="font-display text-4xl font-light text-orange-500 tabular">
              {countdown.hours}
            </span>
            <span className="text-sm text-orange-300 mr-2">h</span>
            <span className="font-display text-4xl font-light text-orange-500 tabular">
              {countdown.minutes.toString().padStart(2, "0")}
            </span>
            <span className="text-sm text-orange-300">m</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[color:var(--type-4)]">
            <span className="flex items-center gap-1">
              <Camera className="w-3 h-3" />
              Golden hour starts at {countdown.goldenStart}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Sunset in {countdown.hours}h {countdown.minutes}m
            </span>
          </div>
        </div>
      )}

      {countdown?.isPast && (
        <div className="alpine-card flex items-center gap-3">
          <Sunset className="w-5 h-5 text-[color:var(--type-4)]" />
          <div>
            <p className="text-sm text-[color:var(--type-2)]">Golden hour has passed for today</p>
            <p className="text-[10px] text-[color:var(--type-4)] mt-0.5">Check back tomorrow</p>
          </div>
        </div>
      )}

      {/* Trail Recommendations */}
      <div className="alpine-card space-y-0.5">
        <div>
          <p className="text-[10px] text-[color:var(--accent)] uppercase tracking-wider font-medium mb-1">Trail Recommendations</p>
          <h3 className="font-medium text-[color:var(--type-1)] text-sm">
            The mountain is out. Great day to hit the trail.
          </h3>
        </div>

        <div className="space-y-0">
          {TRAILS.map((trail) => (
            <div
              key={trail.name}
              className="group flex items-start gap-3 py-2.5 border-b border-[var(--rule)] last:border-0"
            >
              <MapPin className="w-3 h-3 text-[color:var(--type-4)] flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[color:var(--type-1)]">{trail.name}</span>
                  {trail.hasRainierView && (
                    <span className="text-[9px] font-medium text-[#2d8a4e] bg-[#2d8a4e]/10 px-1.5 py-0.5 rounded-full">
                      Rainier View
                    </span>
                  )}
                </div>
                <p className="text-xs text-[color:var(--type-3)] mt-0.5 leading-relaxed">{trail.highlight}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-[color:var(--type-4)]">
                  <span>{trail.distance}</span>
                  <span>&middot;</span>
                  <span className={trail.difficulty === "Easy" ? "text-[#2d8a4e]" : "text-[#d4a843]"}>
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
