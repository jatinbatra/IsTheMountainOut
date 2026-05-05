"use client";

import { memo } from "react";

interface Props {
  score: number;
  isVisible: boolean;
  isNight?: boolean;
  seasonLabel: string;
}

const MountainSilhouetteScore = memo(function MountainSilhouetteScore({
  score,
  isVisible,
  isNight,
  seasonLabel,
}: Props) {
  const height = Math.max(20, (score / 100) * 100);
  const snowCapHeight = height * 0.25;
  const baseHeight = height - snowCapHeight;

  const accentColor = score >= 70
    ? "var(--season-accent)"
    : score >= 50
      ? "var(--season-accent-secondary)"
      : "var(--text-tertiary)";

  return (
    <div className="flex items-end gap-6">
      {/* Mountain silhouette SVG */}
      <div className="relative w-[140px] h-[120px] flex items-end justify-center">
        <svg
          viewBox="0 0 140 120"
          className="w-full h-full"
          aria-hidden="true"
        >
          {/* Mountain base */}
          <path
            d={`M 10 120 L 50 ${120 - baseHeight} L 70 ${120 - height} L 90 ${120 - baseHeight} L 130 120 Z`}
            fill="var(--season-mountain-base)"
            className="transition-all duration-1000"
            style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
          />
          {/* Snow cap */}
          <path
            d={`M 50 ${120 - baseHeight} L 70 ${120 - height} L 90 ${120 - baseHeight} L 80 ${120 - baseHeight + 8} L 60 ${120 - baseHeight + 8} Z`}
            fill="var(--season-mountain-snow)"
            className="transition-all duration-1000"
            style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
          />
          {/* Secondary peak */}
          <path
            d={`M 95 120 L 110 ${120 - baseHeight * 0.5} L 125 ${120 - baseHeight * 0.6} L 135 120 Z`}
            fill="var(--season-mountain-base)"
            opacity="0.5"
            className="transition-all duration-1000"
          />
          {/* Evergreen trees at base */}
          {[20, 30, 110, 120].map((x) => (
            <polygon
              key={x}
              points={`${x},120 ${x + 4},106 ${x + 8},120`}
              fill="var(--season-accent)"
              opacity="0.4"
            />
          ))}
        </svg>
      </div>

      {/* Score + status text */}
      <div className="pb-1">
        <div className="flex items-baseline gap-2">
          <span
            className="font-display leading-none tabular-nums select-none"
            style={{ fontSize: "clamp(3.5rem, 12vw, 6rem)", color: accentColor }}
          >
            {score}
          </span>
          <span className="text-[var(--text-tertiary)] text-sm font-mono">/100</span>
        </div>
        <p
          className="font-mono text-xs tracking-widest uppercase mt-1"
          style={{ color: accentColor }}
        >
          {seasonLabel}
        </p>
        {isNight && isVisible && (
          <p className="font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5">Stars visible tonight</p>
        )}
      </div>
    </div>
  );
});

export default MountainSilhouetteScore;
