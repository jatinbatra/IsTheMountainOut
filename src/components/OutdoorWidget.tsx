"use client";

import { useState, useEffect } from "react";
import { Sunset, MapPin, Clock, ChevronRight, TreePine, Camera } from "lucide-react";

interface Props {
  isVisible: boolean;
  sunset?: string; // ISO string or HH:MM format
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
    // HH:MM format — assume today, Pacific time
    const [h, m] = sunset.split(":").map(Number);
    sunsetDate = new Date();
    sunsetDate.setHours(h, m, 0, 0);
  }

  // Golden hour starts ~1 hour before sunset
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

  // Update countdown every minute
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
        <div className="glass rounded-3xl p-6 space-y-4 ring-1 ring-amber-400/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10">
              <Sunset className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">
                Golden Hour Countdown
              </h3>
              <p className="text-[11px] text-white/30">
                Best light for Rainier photography
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-1 pl-1">
            <span className="font-display text-5xl font-black text-amber-300/90">
              {countdown.hours}
            </span>
            <span className="text-lg text-amber-300/40 font-medium mr-2">h</span>
            <span className="font-display text-5xl font-black text-amber-300/90">
              {countdown.minutes.toString().padStart(2, "0")}
            </span>
            <span className="text-lg text-amber-300/40 font-medium">m</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-white/30">
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
        <div className="glass rounded-3xl p-6 ring-1 ring-violet-400/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-500/10">
              <Sunset className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Golden hour has passed for today</p>
              <p className="text-xs text-white/30">Check back tomorrow for the next window</p>
            </div>
          </div>
        </div>
      )}

      {/* Trail Recommendations */}
      <div className="glass rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10">
            <TreePine className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white">
              Trail Recommendations
            </h3>
            <p className="text-[11px] text-white/30">
              The mountain is out! Great day to hit the trail.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {TRAILS.map((trail) => (
            <div
              key={trail.name}
              className="group flex items-start gap-3 p-3 rounded-2xl hover:bg-white/[0.03] transition-colors cursor-default"
            >
              <div className="mt-0.5 p-1.5 rounded-lg bg-white/[0.04]">
                <MapPin className="w-3.5 h-3.5 text-white/30" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{trail.name}</span>
                  {trail.hasRainierView && (
                    <span className="text-[9px] font-bold text-emerald-400/70 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Rainier View
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{trail.highlight}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/20">
                  <span>{trail.distance}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span className={trail.difficulty === "Easy" ? "text-emerald-400/50" : "text-amber-400/50"}>
                    {trail.difficulty}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/20 transition-colors mt-1 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
