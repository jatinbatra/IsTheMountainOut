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
  { label: string; verdict: string; aria: string }
> = {
  out: {
    label: "Out.",
    verdict: "The mountain is here.",
    aria: "Mountain is out",
  },
  peeking: {
    label: "Peeking.",
    verdict: "Almost. Step outside.",
    aria: "Mountain is peeking through",
  },
  hiding: {
    label: "Hiding.",
    verdict: "The mountain has gone home.",
    aria: "Mountain is hiding",
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

function ContourMark() {
  return (
    <svg
      width="280"
      height="280"
      viewBox="0 0 280 280"
      className="absolute -right-12 top-8 opacity-[0.10] pointer-events-none animate-fade-in"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.6">
        <circle cx="140" cy="140" r="20" />
        <circle cx="140" cy="140" r="42" />
        <circle cx="140" cy="140" r="68" strokeDasharray="2 4" />
        <circle cx="140" cy="140" r="96" />
        <circle cx="140" cy="140" r="125" strokeDasharray="3 5" />
        <path d="M50 140 Q90 120 130 140" strokeWidth="0.4" />
        <path d="M150 140 Q190 160 230 140" strokeWidth="0.4" />
      </g>
      <text x="140" y="145" textAnchor="middle" fontSize="9" fill="currentColor" fontFamily="var(--font-mono)">
        14,411
      </text>
    </svg>
  );
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

  const accentColor =
    status === "out"
      ? "text-[color:var(--accent-clear)]"
      : status === "peeking"
        ? "text-[color:var(--accent)]"
        : "text-[color:var(--accent-fog)]";

  return (
    <article
      className="relative py-10 sm:py-16"
      role="region"
      aria-label="Mountain visibility status"
    >
      <ContourMark />

      {/* Editorial dateline */}
      <header className="dateline-rule mb-12 stagger-1 animate-fade-up">
        <span className="dateline">No. 001 / Mt. Rainier Field Report</span>
      </header>

      {/* Headline grid: serif verdict left, score right */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-x-10 gap-y-6 items-end mb-10">
        <div className="stagger-2 animate-fade-up">
          {nightWithClearSkies ? (
            <>
              <h1
                className="font-display font-light leading-[0.95] tracking-[-0.03em] text-[color:var(--type-1)]"
                style={{ fontSize: "clamp(3.5rem, 11vw, 8rem)" }}
                aria-label="Clear skies tonight"
              >
                Clear<span className={accentColor}>.</span>
              </h1>
              <p className="text-[color:var(--type-3)] text-[15px] mt-4 max-w-md">
                Skies are clear tonight. The mountain returns at {sunriseStr}.
              </p>
            </>
          ) : (
            <>
              <h1
                className={`font-display font-light leading-[0.95] tracking-[-0.03em] text-[color:var(--type-1)]`}
                style={{ fontSize: "clamp(3.5rem, 11vw, 8rem)" }}
                aria-label={statusCopy.aria}
              >
                {statusCopy.label.replace(".", "")}
                <span className={accentColor}>.</span>
              </h1>
              <p className="text-[color:var(--type-2)] text-[17px] mt-4 max-w-md font-display italic font-light leading-snug">
                {statusCopy.verdict}
              </p>
            </>
          )}
        </div>

        {/* Score block — editorial number, not a gauge */}
        <div className="stagger-3 animate-fade-up flex sm:flex-col items-baseline sm:items-end gap-3 sm:gap-1">
          <span className="ticker text-[color:var(--type-3)]">Visibility Index</span>
          <div className="flex items-baseline gap-1">
            <span
              className="font-display font-light text-[color:var(--type-1)] tabular leading-none"
              style={{ fontSize: "clamp(3rem, 8vw, 5rem)" }}
              aria-label={`Score: ${score} out of 100`}
            >
              {score}
            </span>
            <span className="font-mono text-sm text-[color:var(--type-3)]">/100</span>
          </div>
        </div>
      </div>

      {/* Score bar — thin, single rule */}
      <div className="mb-8 stagger-3 animate-fade-up">
        <div
          className="w-full h-px bg-[var(--rule)] relative overflow-hidden"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Visibility score"
        >
          <div
            className={`absolute left-0 top-[-1px] h-[3px] animate-score-fill ${
              status === "out"
                ? "bg-[color:var(--accent-clear)]"
                : status === "peeking"
                  ? "bg-[color:var(--accent)]"
                  : "bg-[color:var(--accent-fog)]"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 ticker text-[color:var(--type-4)]">
          <span>0 / Hidden</span>
          <span>50 / Peeking</span>
          <span>100 / Out</span>
        </div>
      </div>

      {/* Editorial body copy */}
      {weatherSentence && (
        <p className="text-[color:var(--type-2)] text-[17px] leading-[1.55] max-w-xl font-display font-light mb-4 stagger-4 animate-fade-up">
          {weatherSentence}
        </p>
      )}

      {/* Metadata strip — like a magazine byline */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[color:var(--type-3)] stagger-5 animate-fade-up">
        <span className="ticker">
          Confidence{" "}
          <span className="font-mono text-[color:var(--type-1)] normal-case tracking-normal">
            {confidence}
          </span>
        </span>
        <span className="text-[color:var(--type-4)]">·</span>
        <span className="text-[14px]">{durationMessage}</span>
      </div>

      {scoreBreakdown && (
        <div className="mt-8 stagger-6 animate-fade-up">
          <button
            onClick={() => setShowMath(!showMath)}
            className="inline-flex items-center gap-2 ticker hover:text-[color:var(--type-2)] transition-colors"
            aria-expanded={showMath}
            aria-controls="score-math"
          >
            <span>Read the math</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-300 ${showMath ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>

          <div
            id="score-math"
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showMath ? "max-h-[300px] opacity-100 mt-6" : "max-h-0 opacity-0"
            }`}
          >
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 max-w-2xl border-t border-[var(--rule)] pt-5">
              <div>
                <dt className="ticker mb-1">Low Cloud</dt>
                <dd className="font-mono text-sm text-[color:var(--type-1)] tabular">{scoreBreakdown.cloudLow}%</dd>
              </div>
              <div>
                <dt className="ticker mb-1">Mid Cloud</dt>
                <dd className="font-mono text-sm text-[color:var(--type-1)] tabular">{scoreBreakdown.cloudMid}%</dd>
              </div>
              <div>
                <dt className="ticker mb-1">High Cloud</dt>
                <dd className="font-mono text-sm text-[color:var(--type-1)] tabular">{scoreBreakdown.cloudHigh}%</dd>
              </div>
              <div>
                <dt className="ticker mb-1">Visibility</dt>
                <dd className="font-mono text-sm text-[color:var(--type-1)] tabular">
                  {Math.round(scoreBreakdown.visibilityMeters / 1609.34)}mi
                </dd>
              </div>
              {scoreBreakdown.pm25 !== undefined && (
                <div>
                  <dt className="ticker mb-1">PM 2.5</dt>
                  <dd className="font-mono text-sm text-[color:var(--type-1)] tabular">{scoreBreakdown.pm25.toFixed(1)}</dd>
                </div>
              )}
            </dl>
            <p className="font-display italic text-[color:var(--type-3)] text-sm mt-4 max-w-md">
              Low clouds matter most. They sit directly between you and the mountain.
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
