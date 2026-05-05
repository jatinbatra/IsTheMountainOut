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
    label: "Good",
    verdict: "You've got a good shot. Go look south.",
    aria: "Mountain is out",
  },
  peeking: {
    label: "Fair",
    verdict: "Almost. Worth stepping outside to check.",
    aria: "Mountain is peeking through",
  },
  hiding: {
    label: "Poor",
    verdict: "The mountain is hiding today.",
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
    return `Crystal clear: ${cloudLow}% low clouds, ${visMiles}mi visibility.`;
  if (score >= 70)
    return `Looking good: light clouds at ${cloudLow}%, ${visMiles}mi visibility.`;
  if (score >= 55)
    return `Borderline: ${cloudLow}% low clouds may block parts of the mountain.`;
  if (score >= 40)
    return `Too many low clouds at ${cloudLow}%. You might see the peak.`;
  if (score >= 20)
    return `Heavy cloud cover at ${cloudLow}%. The mountain is hiding.`;
  return `Socked in: ${cloudLow}% cloud cover and only ${visMiles}mi visibility.`;
}

function CircularGauge({ score, status }: { score: number; status: VisibilityStatus }) {
  const size = 160;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const halfCircumference = Math.PI * radius;
  const fillAmount = (score / 100) * halfCircumference;
  const dashOffset = halfCircumference - fillAmount;

  const gaugeColor =
    status === "out"
      ? "var(--gauge-good)"
      : status === "peeking"
        ? "var(--gauge-mid)"
        : "var(--gauge-poor)";

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size / 2 + 28 }}>
      <svg
        width={size}
        height={size / 2 + strokeWidth}
        viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
        className="overflow-visible"
      >
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={halfCircumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000"
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        />
        {[0, 50, 100].map((tick) => {
          const angle = Math.PI * (1 - tick / 100);
          const innerR = radius - strokeWidth / 2 - 3;
          const outerR = radius - strokeWidth / 2 - 8;
          return (
            <line
              key={tick}
              x1={size / 2 + innerR * Math.cos(angle)}
              y1={size / 2 - innerR * Math.sin(angle)}
              x2={size / 2 + outerR * Math.cos(angle)}
              y2={size / 2 - outerR * Math.sin(angle)}
              stroke="var(--rule-strong)"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <div className="font-display font-light text-[color:var(--type-1)] leading-none tabular text-[2.75rem]">
          {score}
        </div>
      </div>
    </div>
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

  const visMiles = scoreBreakdown
    ? (scoreBreakdown.visibilityMeters / 1609.34).toFixed(0)
    : null;

  const gaugeColor =
    status === "out" ? "var(--gauge-good)" : status === "peeking" ? "var(--gauge-mid)" : "var(--gauge-poor)";

  return (
    <div
      className="animate-fade-up"
      role="region"
      aria-label="Mountain visibility status"
    >
      {/* Gauge + status + stats — one continuous block */}
      <div className="flex flex-col items-center text-center pt-6 pb-4">
        <CircularGauge score={score} status={status} />
        <p
          className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] mt-1"
          style={{ color: gaugeColor }}
        >
          {statusCopy.label}
        </p>
        <p className="text-[color:var(--type-3)] text-sm mt-1.5 max-w-xs">
          {isNight && isVisible
            ? `Skies are clear tonight. The mountain returns at ${sunriseStr}.`
            : statusCopy.verdict}
        </p>
      </div>

      {/* Stats inline */}
      {scoreBreakdown && (
        <div className="grid grid-cols-3 gap-4 text-center py-4 border-t border-[var(--rule)]">
          <div>
            <p className="font-mono text-xl font-light text-[color:var(--type-1)] tabular">
              {scoreBreakdown.cloudLow}<span className="text-xs text-[color:var(--type-4)]">%</span>
            </p>
            <p className="text-[10px] text-[color:var(--type-4)]">Low Clouds</p>
          </div>
          <div>
            <p className="font-mono text-xl font-light text-[color:var(--type-1)] tabular">
              {visMiles}<span className="text-xs text-[color:var(--type-4)]"> mi</span>
            </p>
            <p className="text-[10px] text-[color:var(--type-4)]">Visibility</p>
          </div>
          <div>
            <p className="font-mono text-xl font-light text-[color:var(--type-1)] tabular">
              {scoreBreakdown.pm25 !== undefined ? scoreBreakdown.pm25.toFixed(0) : "—"}
              <span className="text-xs text-[color:var(--type-4)]"> µg</span>
            </p>
            <p className="text-[10px] text-[color:var(--type-4)]">PM2.5</p>
          </div>
        </div>
      )}

      {/* Confidence + duration */}
      {scoreBreakdown && (
        <div className="flex items-center justify-between py-3 border-t border-[var(--rule)] text-[11px] text-[color:var(--type-4)]">
          <span>Confidence: <span className="text-[color:var(--type-1)] font-medium">{confidence}</span></span>
          <span>{durationMessage}</span>
        </div>
      )}

      {/* Weather sentence */}
      {weatherSentence && (
        <div className="py-4 border-t border-[var(--rule)]">
          <p className="pullquote text-[color:var(--type-2)] text-base">
            {weatherSentence}
          </p>

          {scoreBreakdown && (
            <button
              onClick={() => setShowMath(!showMath)}
              className="inline-flex items-center gap-1 mt-2 text-[11px] text-[color:var(--type-4)] hover:text-[color:var(--type-1)] transition-colors"
              aria-expanded={showMath}
              aria-controls="score-math"
            >
              <span>View breakdown</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-300 ${showMath ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          )}

          {scoreBreakdown && (
            <div
              id="score-math"
              className={`overflow-hidden transition-all duration-500 ${
                showMath ? "max-h-[300px] opacity-100 mt-3" : "max-h-0 opacity-0"
              }`}
              style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--rule)]">
                {[
                  { label: "Low Cloud", value: `${scoreBreakdown.cloudLow}%` },
                  { label: "Mid Cloud", value: `${scoreBreakdown.cloudMid}%` },
                  { label: "High Cloud", value: `${scoreBreakdown.cloudHigh}%` },
                  { label: "Visibility", value: `${visMiles}mi` },
                  ...(scoreBreakdown.pm25 !== undefined
                    ? [{ label: "PM 2.5", value: scoreBreakdown.pm25.toFixed(1) }]
                    : []),
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] text-[color:var(--type-4)] uppercase tracking-wider">{item.label}</p>
                    <p className="font-mono text-sm text-[color:var(--type-1)] tabular">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
