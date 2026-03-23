"use client";

import { SkyTheme } from "@/lib/sky";

interface Props {
  skyTheme: SkyTheme;
  isVisible: boolean;
  viewpointName?: string;
}

export default function MountainScene({ skyTheme, isVisible, viewpointName }: Props) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
      <svg
        viewBox="0 0 800 450"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Mountain gradient for depth */}
          <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTheme.snowFill} />
            <stop offset="40%" stopColor={skyTheme.snowFill} />
            <stop offset="45%" stopColor={skyTheme.mountainFill} />
            <stop offset="100%" stopColor={skyTheme.mountainFill} />
          </linearGradient>

          {/* Glow filter for sun/moon */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Fog gradient */}
          <linearGradient id="fogGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="60%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Sky background */}
        <rect width="800" height="450" fill="url(#skyBg)" />
        <foreignObject width="800" height="450">
          <div
            style={{
              width: "100%",
              height: "100%",
              background: skyTheme.skyGradient,
            }}
          />
        </foreignObject>

        {/* Stars (night only) */}
        {skyTheme.showStars && (
          <g opacity="0.8">
            {[
              [120, 40], [200, 80], [340, 30], [480, 60], [600, 45],
              [700, 90], [80, 100], [260, 110], [530, 100], [650, 25],
              [150, 150], [420, 50], [560, 130], [720, 140], [380, 120],
            ].map(([cx, cy], i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={Math.random() > 0.5 ? 1.5 : 1}
                fill="white"
                opacity={0.5 + Math.random() * 0.5}
              />
            ))}
          </g>
        )}

        {/* Sun */}
        {skyTheme.showSun && (
          <circle
            cx="620"
            cy="100"
            r="35"
            fill={skyTheme.sunMoonColor}
            filter="url(#glow)"
            opacity="0.9"
          />
        )}

        {/* Moon */}
        {skyTheme.showMoon && (
          <g filter="url(#glow)">
            <circle cx="620" cy="90" r="25" fill={skyTheme.sunMoonColor} />
            <circle cx="610" cy="82" r="22" fill={skyTheme.skyGradient.includes("#0a0a2e") ? "#0a0a2e" : "#1a1a3e"} />
          </g>
        )}

        {/* Cloud layer */}
        {skyTheme.cloudOpacity > 0.1 && (
          <g opacity={skyTheme.cloudOpacity}>
            {/* Cloud 1 */}
            <g transform="translate(80, 100)">
              <ellipse cx="0" cy="0" rx="60" ry="20" fill="white" opacity="0.5" />
              <ellipse cx="30" cy="-8" rx="40" ry="18" fill="white" opacity="0.6" />
              <ellipse cx="-20" cy="-5" rx="35" ry="15" fill="white" opacity="0.4" />
            </g>
            {/* Cloud 2 */}
            <g transform="translate(500, 130)">
              <ellipse cx="0" cy="0" rx="70" ry="22" fill="white" opacity="0.5" />
              <ellipse cx="40" cy="-10" rx="45" ry="20" fill="white" opacity="0.6" />
              <ellipse cx="-30" cy="-5" rx="40" ry="16" fill="white" opacity="0.4" />
            </g>
            {/* Cloud 3 */}
            <g transform="translate(300, 80)">
              <ellipse cx="0" cy="0" rx="50" ry="18" fill="white" opacity="0.4" />
              <ellipse cx="25" cy="-6" rx="35" ry="15" fill="white" opacity="0.5" />
            </g>
          </g>
        )}

        {/* Foreground hills (Seattle skyline silhouette for city viewpoints) */}
        <path
          d="M0 380 Q50 360 100 370 Q150 355 200 365 Q250 350 300 360 Q350 345 400 355 Q450 340 500 350 Q550 345 600 355 Q650 340 700 350 Q750 345 800 360 L800 450 L0 450 Z"
          fill="#1a2840"
          opacity="0.8"
        />

        {/* Mt. Rainier silhouette — the hero */}
        <g
          className={isVisible ? "animate-float" : ""}
          style={!isVisible ? { opacity: 0.15 } : undefined}
        >
          {/* Mountain body */}
          <path
            d="M280 350 L340 230 L360 245 L380 210 L400 195 L420 210 L440 240 L460 225 L520 350 Z"
            fill={skyTheme.mountainFill}
          />
          {/* Snow cap */}
          <path
            d="M340 230 L360 245 L380 210 L400 195 L420 210 L440 240 L460 225 L448 250 L430 240 L410 255 L390 240 L370 255 L350 240 Z"
            fill={skyTheme.snowFill}
            opacity="0.95"
          />
          {/* Glaciers / ridges */}
          <path
            d="M370 255 L380 280 L395 265 L410 285 L420 260 L430 280 L440 255"
            fill="none"
            stroke={skyTheme.snowFill}
            strokeWidth="2"
            opacity="0.3"
          />
        </g>

        {/* Fog layer */}
        {skyTheme.fogOpacity > 0 && (
          <rect
            x="0"
            y="250"
            width="800"
            height="200"
            fill="url(#fogGrad)"
            opacity={skyTheme.fogOpacity}
          />
        )}

        {/* Water reflection (for waterfront viewpoints) */}
        <rect x="0" y="400" width="800" height="50" fill="#0a1628" opacity="0.6" />
        <line x1="50" y1="420" x2="180" y2="420" stroke="white" strokeWidth="0.5" opacity="0.15" />
        <line x1="300" y1="430" x2="500" y2="430" stroke="white" strokeWidth="0.5" opacity="0.1" />
        <line x1="600" y1="415" x2="750" y2="415" stroke="white" strokeWidth="0.5" opacity="0.12" />
      </svg>

      {/* Viewpoint label */}
      {viewpointName && (
        <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white/70">
          View from {viewpointName}
        </div>
      )}

      {/* Sky condition label */}
      <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white/70">
        {skyTheme.label}
      </div>
    </div>
  );
}
