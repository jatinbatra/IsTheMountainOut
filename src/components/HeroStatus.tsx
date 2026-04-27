"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, ChevronDown, AlertTriangle } from "lucide-react";
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
  { label: string; gradient: string; aria: string; range: string; caption: string }
> = {
  out: {
    label: "OUT!",
    gradient: "gradient-text",
    aria: "Mountain is out",
    range: "76–100",
    caption: "clearly visible",
  },
  peeking: {
    label: "PEEKING",
    gradient: "gradient-text-amber",
    aria: "Mountain is peeking through",
    range: "41–75",
    caption: "partially visible",
  },
  hiding: {
    label: "HIDING",
    gradient: "gradient-text-red",
    aria: "Mountain is hiding",
    range: "0–40",
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
    return "Snow is falling \u2014 the mountain is completely hidden.";
  if (weatherCode >= WMO.SHOWERS_MIN)
    return "Showers are blocking the view. Try again after the rain passes.";

  if (score >= 85)
    return `Crystal clear \u2014 ${cloudLow}% low clouds, ${visMiles}mi visibility. Go see it now.`;
  if (score >= 70)
    return `Looking good \u2014 light clouds at ${cloudLow}%, ${visMiles}mi visibility. Worth stepping outside.`;
  if (score >= 55)
    return `Borderline \u2014 ${cloudLow}% low clouds may block parts of the mountain. ${visMiles}mi visibility.`;
  if (score >= 40)
    return `Too many low clouds at ${cloudLow}%. You might see the peak poking through.`;
  if (score >= 20)
    return `Heavy cloud cover at ${cloudLow}%. The mountain is hiding today.`;
  return `Completely socked in \u2014 ${cloudLow}% cloud cover and only ${visMiles}mi visibility.`;
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
    <div className="relative animate-fade-up" role="region" aria-label="Mountain visibility status">
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] ring-1 ring-white/[0.06]">
          <AlertTriangle className="w-3 h-3 text-amber-400/60" aria-hidden="true" />
          <span className="text-[10px] text-white/35 font-medium">
            Weather-based prediction
          </span>
        </div>
      </div>

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none animate-hero-glow"
        style={{
          background:
            status === "out"
              ? `radial-gradient(ellipse, rgba(52,211,153,${0.15 + score / 400}) 0%, rgba(59,130,246,0.03) 40%, transparent 65%)`
              : status === "peeking"
                ? "radial-gradient(ellipse, rgba(251,191,36,0.12) 0%, rgba(251,146,60,0.04) 40%, transparent 65%)"
                : "radial-gradient(ellipse, rgba(248,113,113,0.10) 0%, rgba(251,146,60,0.03) 40%, transparent 65%)",
        }}
        aria-hidden="true"
      />

      <div className="relative text-center space-y-6">
        <p className="font-display text-[11px] font-semibold tracking-[0.35em] uppercase text-slate-500">
          Is the Mountain Out?
        </p>

        <div className="relative py-4">
          {nightWithClearSkies ? (
            <>
              <h1
                className="font-display font-black leading-[0.8] tracking-[-0.06em] gradient-text"
                style={{ fontSize: "clamp(4rem, 14vw, 10rem)" }}
                aria-label="Clear skies tonight"
              >
                CLEAR
              </h1>
              <p className="text-white/40 text-sm mt-4 font-medium">
                Clear skies tonight &mdash; check at {sunriseStr}
              </p>
            </>
          ) : (
            <>
              <h1
                className={`font-display font-black leading-[0.8] tracking-[-0.06em] ${statusCopy.gradient}`}
                style={{
                  fontSize:
                    status === "peeking"
                      ? "clamp(4.5rem, 15vw, 11rem)"
                      : "clamp(7rem, 22vw, 16rem)",
                }}
                aria-label={statusCopy.aria}
              >
                {statusCopy.label}
              </h1>
              <p className="mt-3 text-[11px] uppercase tracking-[0.3em] font-semibold text-slate-500">
                <span className="font-mono text-white/40 tabular-nums">
                  {statusCopy.range}
                </span>
                <span className="mx-2 text-white/10">·</span>
                <span>{statusCopy.caption}</span>
              </p>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <span
              className="font-display text-5xl font-black text-white tracking-tight"
              aria-label={`Score: ${score} out of 100`}
            >
              {score}
            </span>
            <div className="text-left">
              <span className="text-slate-600 text-lg font-light block leading-none">/100</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${
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

          <div
            className="max-w-xs mx-auto"
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Visibility score"
          >
            <div className="w-full h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full animate-score-fill ${
                  status === "out"
                    ? "bg-emerald-400/70"
                    : status === "peeking"
                      ? "bg-amber-400/70"
                      : "bg-red-400/60"
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {weatherSentence && (
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            {weatherSentence}
          </p>
        )}

        {scoreBreakdown && (
          <button
            onClick={() => setShowMath(!showMath)}
            className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-colors font-medium"
            aria-expanded={showMath}
            aria-controls="score-math"
          >
            <span>Show math</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-300 ${showMath ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}

        {scoreBreakdown && (
          <div
            id="score-math"
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showMath ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-slate-500">
              <span>Low clouds: {scoreBreakdown.cloudLow}%</span>
              <span>Mid clouds: {scoreBreakdown.cloudMid}%</span>
              <span>High clouds: {scoreBreakdown.cloudHigh}%</span>
              <span>
                Visibility: {Math.round(scoreBreakdown.visibilityMeters / 1609.34)}mi
              </span>
              {scoreBreakdown.pm25 !== undefined && (
                <span>PM2.5: {scoreBreakdown.pm25.toFixed(1)}</span>
              )}
            </div>
            <p className="text-[10px] text-slate-600 mt-3 tracking-wide">
              Low clouds matter most &mdash; they sit directly between you and the mountain
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2.5 pt-2">
          {nightWithClearSkies ? (
            <>
              <TrendingUp className="w-4 h-4 text-emerald-400/50" aria-hidden="true" />
              <p className="text-white/45 text-sm leading-relaxed">
                Conditions are clear. If this holds, the mountain should be visible at{" "}
                {sunriseStr}.
              </p>
            </>
          ) : status === "hiding" ? (
            <>
              <TrendingDown className="w-4 h-4 text-red-400/50" aria-hidden="true" />
              <p className="text-white/45 text-sm leading-relaxed">{durationMessage}</p>
            </>
          ) : (
            <>
              <TrendingUp
                className={`w-4 h-4 ${status === "out" ? "text-emerald-400/50" : "text-amber-400/50"}`}
                aria-hidden="true"
              />
              <p className="text-white/45 text-sm leading-relaxed">{durationMessage}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
