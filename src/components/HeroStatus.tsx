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

function MountainSilhouette() {
  return (
    <svg
      viewBox="0 0 400 120"
      className="absolute bottom-0 left-0 right-0 w-full"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="treeLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b4a2b" />
          <stop offset="100%" stopColor="#1a2e1a" />
        </linearGradient>
        <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a6a5a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#2b3e2b" />
        </linearGradient>
      </defs>
      {/* Far mountain range */}
      <path
        d="M0 80 L60 45 L100 60 L140 30 L180 50 L200 20 L220 50 L260 35 L300 55 L340 40 L380 55 L400 48 L400 120 L0 120Z"
        fill="url(#mountainGrad)"
        opacity="0.5"
      />
      {/* Closer mountain / Rainier */}
      <path
        d="M120 120 L160 65 L185 40 L200 28 L215 40 L240 65 L280 120Z"
        fill="#3a5a4a"
        opacity="0.4"
      />
      {/* Snow cap */}
      <path
        d="M175 52 L185 40 L200 28 L215 40 L225 52 L210 48 L200 52 L190 48Z"
        fill="rgba(255,255,255,0.25)"
      />
      {/* Tree line */}
      <path
        d="M0 95 L10 88 L15 95 L25 82 L30 95 L40 78 L45 92 L55 80 L65 95 L75 82 L80 90 L90 78 L100 92 L110 85 L120 95 L130 80 L135 88 L145 78 L155 90 L160 95 L170 85 L180 92 L190 95 L200 88 L210 95 L220 82 L230 92 L240 85 L250 95 L260 80 L265 88 L275 78 L285 90 L295 82 L305 92 L310 95 L320 85 L330 78 L340 90 L350 82 L360 95 L370 85 L380 90 L390 82 L400 92 L400 120 L0 120Z"
        fill="url(#treeLine)"
      />
    </svg>
  );
}

function CircularGauge({ score, status }: { score: number; status: VisibilityStatus }) {
  const size = 200;
  const strokeWidth = 10;
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
    <div className="relative flex flex-col items-center" style={{ width: size, height: size / 2 + 36 }}>
      <svg
        width={size}
        height={size / 2 + strokeWidth}
        viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
        className="overflow-visible"
      >
        {/* Track */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="var(--rule)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill */}
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
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = Math.PI * (1 - tick / 100);
          const innerR = radius - strokeWidth / 2 - 4;
          const outerR = radius - strokeWidth / 2 - 10;
          const x1 = size / 2 + innerR * Math.cos(angle);
          const y1 = size / 2 - innerR * Math.sin(angle);
          const x2 = size / 2 + outerR * Math.cos(angle);
          const y2 = size / 2 - outerR * Math.sin(angle);
          return (
            <line
              key={tick}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="var(--rule-strong)"
              strokeWidth="1"
            />
          );
        })}
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <div
          className="font-display font-light text-[color:var(--type-1)] leading-none tabular"
          style={{ fontSize: "3.25rem" }}
        >
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
    <div className="space-y-8">
      {/* Hero */}
      <div
        className="text-center pt-8 pb-4 stagger-1 animate-fade-up"
        role="region"
        aria-label="Mountain visibility status"
      >
        <div className="flex flex-col items-center">
          <CircularGauge score={score} status={status} />

          <div className="mt-3 space-y-2">
            <p
              className="font-mono text-xs font-medium uppercase tracking-widest"
              style={{ color: gaugeColor }}
            >
              {statusCopy.label}
            </p>
            <p className="text-[color:var(--type-3)] text-sm max-w-xs mx-auto">
              {isNight && isVisible
                ? `Skies are clear tonight. The mountain returns at ${sunriseStr}.`
                : statusCopy.verdict}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {scoreBreakdown && (
        <div className="border-t border-[var(--rule)] pt-6 stagger-2 animate-fade-up">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="font-mono text-2xl font-light text-[color:var(--type-1)] tabular">
                {scoreBreakdown.cloudLow}<span className="text-sm text-[color:var(--type-4)]">%</span>
              </p>
              <p className="text-[11px] text-[color:var(--type-4)] mt-1">Low Clouds</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-light text-[color:var(--type-1)] tabular">
                {visMiles}<span className="text-sm text-[color:var(--type-4)]"> mi</span>
              </p>
              <p className="text-[11px] text-[color:var(--type-4)] mt-1">Visibility</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-light text-[color:var(--type-1)] tabular">
                {scoreBreakdown.pm25 !== undefined
                  ? scoreBreakdown.pm25.toFixed(0)
                  : "—"}
                <span className="text-sm text-[color:var(--type-4)]"> µg</span>
              </p>
              <p className="text-[11px] text-[color:var(--type-4)] mt-1">PM2.5</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5 pt-3 border-t border-[var(--rule)]">
            <span className="text-xs text-[color:var(--type-4)]">
              Confidence: <span className="text-[color:var(--type-1)] font-medium">{confidence}</span>
            </span>
            <span className="text-xs text-[color:var(--type-4)]">{durationMessage}</span>
          </div>
        </div>
      )}

      {/* Weather sentence */}
      {weatherSentence && (
        <div className="stagger-3 animate-fade-up">
          <p className="pullquote text-[color:var(--type-2)] text-lg leading-relaxed">
            {weatherSentence}
          </p>

          {scoreBreakdown && (
            <div className="mt-4">
              <button
                onClick={() => setShowMath(!showMath)}
                className="inline-flex items-center gap-1.5 text-xs text-[color:var(--type-3)] hover:text-[color:var(--type-1)] transition-colors font-medium"
                aria-expanded={showMath}
                aria-controls="score-math"
              >
                <span>View breakdown</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${showMath ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              <div
                id="score-math"
                className={`overflow-hidden transition-all duration-500 ${
                  showMath ? "max-h-[300px] opacity-100 mt-4" : "max-h-0 opacity-0"
                }`}
                style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-[var(--rule)]">
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
                      <p className="text-[10px] text-[color:var(--type-4)] uppercase tracking-wider mb-0.5">{item.label}</p>
                      <p className="font-mono text-sm text-[color:var(--type-1)] tabular">{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[color:var(--type-3)] italic mt-3">
                  Low clouds matter most — they sit between you and the mountain.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
