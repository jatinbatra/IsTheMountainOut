"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { WMO, getVisibilityStatus, type VisibilityStatus } from "@/lib/visibility";

interface Props {
  isVisible: boolean;
  score: number;
  confidence: string;
  durationMessage: string;
  isNight?: boolean;
  sunrise?: string;
  scoreBreakdown?: {
    cloudLow: number;
    cloudMid: number;
    cloudHigh: number;
    visibilityMeters: number;
    pm25?: number;
    weatherCode: number;
  };
}

const STATUS_COPY: Record<
  VisibilityStatus,
  { label: string; color: string; aria: string; caption: string }
> = {
  out: {
    label: "OUT!",
    color: "text-emerald-400",
    aria: "Mountain is out",
    caption: "clearly visible",
  },
  peeking: {
    label: "PEEKING",
    color: "text-amber-400",
    aria: "Mountain is peeking through",
    caption: "partially visible",
  },
  hiding: {
    label: "HIDING",
    color: "text-red-400/80",
    aria: "Mountain is hiding",
    caption: "not visible",
  },
};

function getWeatherSentence(
  score: number,
  cloudLow: number,
  visibilityMeters: number,
  weatherCode: number,
): string {
  const visMiles = Math.round(visibilityMeters / 1609.34);

  if (weatherCode >= WMO.FOG_MIN && weatherCode <= WMO.FOG_MAX)
    return "Fog is blocking all views. Wait for it to burn off.";
  if (weatherCode >= WMO.DRIZZLE_MIN && weatherCode <= WMO.RAIN_MAX)
    return "Rain is cutting visibility. Check back when it clears.";
  if (weatherCode >= WMO.SNOW_MIN && weatherCode <= WMO.SNOW_MAX)
    return "Snow is falling. The mountain is completely hidden.";
  if (weatherCode >= WMO.SHOWERS_MIN)
    return "Showers are blocking the view. Try again after the rain passes.";

  if (score >= 85)
    return `Crystal clear: ${cloudLow}% low clouds, ${visMiles}mi visibility. Go see it now.`;
  if (score >= 70)
    return `Looking good: light clouds at ${cloudLow}%, ${visMiles}mi visibility. Worth stepping outside.`;
  if (score >= 55)
    return `Borderline: ${cloudLow}% low clouds may block parts of the mountain. ${visMiles}mi visibility.`;
  if (score >= 40)
    return `Too many low clouds at ${cloudLow}%. You might see the peak poking through.`;
  if (score >= 20)
    return `Heavy cloud cover at ${cloudLow}%. The mountain is hiding today.`;
  return `Completely socked in: ${cloudLow}% cloud cover and only ${visMiles}mi visibility.`;
}

export default function HeroStatus({
  isVisible,
  score,
  confidence,
  durationMessage,
  isNight,
  sunrise,
  scoreBreakdown,
}: Props) {
  const status = getVisibilityStatus(score);
  const nightWithClearSkies = isNight && isVisible;
  const [showMath, setShowMath] = useState(false);
  const statusCopy = STATUS_COPY[status];

  const sunriseStr = sunrise
    ? new Date(sunrise).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Los_Angeles",
      })
    : "sunrise";

  const weatherSentence = scoreBreakdown
    ? getWeatherSentence(
        score,
        scoreBreakdown.cloudLow,
        scoreBreakdown.visibilityMeters,
        scoreBreakdown.weatherCode,
      )
    : null;

  return (
    <div className="relative py-10 sm:py-16" role="region" aria-label="Mountain visibility status">
      <div className="relative text-center">
        <p className="text-[13px] font-medium tracking-[0.15em] uppercase text-white/25 mb-10">
          Is the Mountain Out?
        </p>

        <div className="mb-10">
          {nightWithClearSkies ? (
            <>
              <h1
                className="font-display font-black leading-[0.85] tracking-[-0.04em] text-emerald-400"
                style={{ fontSize: "clamp(5rem, 16vw, 12rem)" }}
                aria-label="Clear skies tonight"
              >
                CLEAR
              </h1>
              <p className="text-white/35 text-sm mt-6">
                Clear skies tonight. Check at {sunriseStr}
              </p>
            </>
          ) : (
            <h1
              className={`font-display font-black leading-[0.85] tracking-[-0.04em] ${statusCopy.color}`}
              style={{
                fontSize:
                  status === "peeking"
                    ? "clamp(5rem, 16vw, 12rem)"
                    : "clamp(7rem, 22vw, 16rem)",
              }}
              aria-label={statusCopy.aria}
            >
              {statusCopy.label}
            </h1>
          )}
        </div>

        <div className="flex items-center justify-center gap-5 mb-8">
          <span
            className="font-display text-[56px] font-black text-white tabular-nums leading-none"
            aria-label={`Score: ${score} out of 100`}
          >
            {score}
          </span>
          <div className="text-left">
            <span className="text-white/15 text-xl font-extralight block leading-none">/100</span>
            <span
              className={`text-[11px] font-semibold mt-1 block ${
                confidence === "high"
                  ? "text-emerald-400/70"
                  : confidence === "moderate"
                    ? "text-amber-400/70"
                    : "text-red-400/70"
              }`}
            >
              {confidence}
            </span>
          </div>
        </div>

        <div className="max-w-[280px] mx-auto mb-8">
          <div
            className="w-full h-[3px] rounded-full bg-white/[0.06] overflow-hidden"
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Visibility score"
          >
            <div
              className={`h-full rounded-full animate-score-fill ${
                status === "out"
                  ? "bg-emerald-400"
                  : status === "peeking"
                    ? "bg-amber-400"
                    : "bg-red-400/80"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {weatherSentence && (
          <p className="text-[15px] text-white/40 max-w-sm mx-auto leading-relaxed mb-6">
            {weatherSentence}
          </p>
        )}

        <p className="text-white/25 text-sm mb-6">{durationMessage}</p>

        {scoreBreakdown && (
          <>
            <button
              onClick={() => setShowMath(!showMath)}
              className="inline-flex items-center gap-1.5 text-xs text-white/15 hover:text-white/35 transition-colors"
              aria-expanded={showMath}
              aria-controls="score-math"
            >
              <span>Show math</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-300 ${showMath ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            <div
              id="score-math"
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                showMath ? "max-h-[200px] opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-white/25">
                <span>Low clouds: {scoreBreakdown.cloudLow}%</span>
                <span>Mid: {scoreBreakdown.cloudMid}%</span>
                <span>High: {scoreBreakdown.cloudHigh}%</span>
                <span>
                  Vis: {Math.round(scoreBreakdown.visibilityMeters / 1609.34)}mi
                </span>
                {scoreBreakdown.pm25 !== undefined && (
                  <span>PM2.5: {scoreBreakdown.pm25.toFixed(1)}</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
