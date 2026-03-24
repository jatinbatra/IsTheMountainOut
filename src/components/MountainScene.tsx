"use client";

import { SkyTheme } from "@/lib/sky";

interface Props {
  skyTheme: SkyTheme;
  isVisible: boolean;
  viewpointName?: string;
  viewpointDistance?: number;
}

export default function MountainScene({
  skyTheme,
  isVisible,
  viewpointName,
  viewpointDistance,
}: Props) {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl ring-1 ring-white/[0.08] shadow-2xl shadow-black/40">
      {/* Outer glow */}
      <div
        className={`absolute -inset-px rounded-3xl pointer-events-none ${
          isVisible
            ? "shadow-[0_0_80px_-20px_rgba(34,197,94,0.15)]"
            : "shadow-[0_0_80px_-20px_rgba(239,68,68,0.1)]"
        }`}
      />

      <svg
        viewBox="0 0 1000 500"
        className="w-full h-auto block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Sky gradient (dynamic) */}
          <linearGradient id="skyBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e6fd9" />
            <stop offset="100%" stopColor="#87CEEB" />
          </linearGradient>

          {/* Mountain body gradient */}
          <linearGradient id="mountainBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a5568" />
            <stop offset="30%" stopColor="#3a4556" />
            <stop offset="100%" stopColor="#2d3748" />
          </linearGradient>

          {/* Snow gradient */}
          <linearGradient id="snowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTheme.snowFill} />
            <stop offset="100%" stopColor={skyTheme.snowFill} stopOpacity="0.7" />
          </linearGradient>

          {/* Glacier blue */}
          <linearGradient id="glacierGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b8d4e8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8ab4d4" stopOpacity="0.3" />
          </linearGradient>

          {/* Treeline gradient */}
          <linearGradient id="treeline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2d4a2e" />
            <stop offset="100%" stopColor="#1a3320" />
          </linearGradient>

          {/* Water reflection */}
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a3a5c" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f2840" />
          </linearGradient>

          {/* Fog gradient */}
          <linearGradient id="fogGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="40%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0.7" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Stronger glow for sun */}
          <filter id="sunGlow">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft shadow for mountain */}
          <filter id="mountainShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.3)" />
          </filter>

          {/* Atmospheric haze */}
          <linearGradient id="hazeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="60%" stopColor="rgba(180,200,220,0.15)" />
            <stop offset="100%" stopColor="rgba(180,200,220,0.4)" />
          </linearGradient>

          {/* Aurora gradient */}
          <linearGradient id="auroraGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
            <stop offset="20%" stopColor="#22c55e" stopOpacity="0.06" />
            <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.08" />
            <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.06" />
            <stop offset="80%" stopColor="#22c55e" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* === SKY === */}
        <foreignObject width="1000" height="500">
          <div
            style={{
              width: "100%",
              height: "100%",
              background: skyTheme.skyGradient,
              transition: "background 1s ease",
            }}
          />
        </foreignObject>

        {/* === AURORA LAYER (subtle) === */}
        {skyTheme.showStars && (
          <g opacity="0.5">
            <path
              d="M0 50 Q200 20 400 60 Q600 30 800 55 Q900 40 1000 50 L1000 180 Q800 150 600 170 Q400 140 200 165 Q100 150 0 160 Z"
              fill="url(#auroraGrad)"
              className="animate-clouds"
            />
          </g>
        )}

        {/* === STARS (night) === */}
        {skyTheme.showStars && (
          <g className="animate-twinkle">
            {[
              [80, 30, 1.5], [150, 70, 1], [250, 25, 1.8], [350, 55, 1],
              [450, 35, 1.3], [550, 65, 1], [650, 20, 1.5], [750, 50, 1],
              [850, 40, 1.8], [920, 75, 1], [120, 100, 1], [320, 90, 1.3],
              [520, 80, 1], [700, 95, 1.5], [180, 45, 1], [420, 15, 1.3],
              [600, 105, 1], [830, 60, 1.5], [50, 85, 1], [960, 30, 1.3],
            ].map(([cx, cy, r], i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="white"
                opacity={0.3 + (i % 4) * 0.15}
              />
            ))}
          </g>
        )}

        {/* === SUN === */}
        {skyTheme.showSun && (
          <g className="animate-sun-pulse">
            <circle cx="780" cy="90" r="60" fill={skyTheme.sunMoonColor} opacity="0.08" />
            <circle cx="780" cy="90" r="50" fill={skyTheme.sunMoonColor} opacity="0.12" />
            <circle cx="780" cy="90" r="38" fill={skyTheme.sunMoonColor} opacity="0.2" />
            <circle cx="780" cy="90" r="28" fill={skyTheme.sunMoonColor} filter="url(#sunGlow)" opacity="0.9" />
          </g>
        )}

        {/* === MOON === */}
        {skyTheme.showMoon && (
          <g filter="url(#glow)">
            <circle cx="780" cy="80" r="22" fill={skyTheme.sunMoonColor} opacity="0.9" />
            <circle cx="770" cy="72" r="19" fill={skyTheme.skyGradient.includes("#0a0a2e") ? "#0a0a2e" : "#1a1a3e"} />
          </g>
        )}

        {/* === DISTANT MOUNTAINS (Cascades backdrop) === */}
        <g opacity={isVisible ? 0.4 : 0.15} className="transition-opacity duration-1000">
          <path
            d="M0 340 L30 310 L60 325 L100 295 L130 315 L160 290 L190 310 L220 330 L220 400 L0 400 Z"
            fill="#4a5a6a"
            opacity="0.5"
          />
          <path
            d="M180 340 L220 300 L260 320 L290 285 L310 305 L340 340 L340 400 L180 400 Z"
            fill="#3a4a5a"
            opacity="0.4"
          />
          <path
            d="M700 340 L740 310 L770 325 L810 290 L840 310 L870 295 L910 315 L950 305 L1000 330 L1000 400 L700 400 Z"
            fill="#4a5a6a"
            opacity="0.5"
          />
        </g>

        {/* === MT. RAINIER === */}
        <g
          className={isVisible ? "animate-mountain-reveal" : ""}
          style={{
            opacity: isVisible ? 1 : 0.12,
            transition: "opacity 1.5s ease",
          }}
          filter={isVisible ? "url(#mountainShadow)" : undefined}
        >
          <path
            d="M330 380 L370 310 L390 325 L410 280 L430 260 L445 240 L460 220 L475 205 L490 195 L505 188 L520 195 L535 205 L550 218 L565 235 L580 255 L595 275 L610 290 L630 315 L650 330 L680 380 Z"
            fill={skyTheme.mountainFill}
          />
          <path
            d="M330 380 L350 345 L370 310 L390 325 L395 335 L380 355 L360 370 L340 378 Z"
            fill={skyTheme.mountainFill}
            opacity="0.8"
          />
          <path
            d="M650 330 L660 345 L665 360 L670 375 L680 380 L660 378 L645 365 L640 345 Z"
            fill={skyTheme.mountainFill}
            opacity="0.8"
          />
          <path
            d="M410 280 L430 260 L445 240 L460 220 L475 205 L490 195 L505 188 L520 195 L535 205 L550 218 L565 235 L580 255 L595 275 L610 290 L598 300 L580 285 L565 295 L550 278 L535 290 L520 275 L505 288 L490 272 L475 285 L460 270 L445 285 L430 275 L418 290 Z"
            fill="url(#snowGrad)"
            opacity="0.95"
          />
          <path
            d="M480 280 L490 310 L500 295 L510 320 L505 340 L495 335 L485 310 Z"
            fill="url(#glacierGrad)"
            opacity="0.5"
          />
          <path
            d="M530 280 L540 305 L550 295 L555 325 L545 340 L535 320 L525 300 Z"
            fill="url(#glacierGrad)"
            opacity="0.5"
          />
          <path
            d="M505 285 L510 300 L520 310 L525 330 L515 335 L505 315 Z"
            fill="url(#glacierGrad)"
            opacity="0.4"
          />
          <g stroke={skyTheme.mountainFill} strokeWidth="1" opacity="0.3">
            <line x1="460" y1="270" x2="470" y2="320" />
            <line x1="545" y1="268" x2="555" y2="310" />
            <line x1="420" y1="290" x2="435" y2="340" />
            <line x1="590" y1="285" x2="600" y2="330" />
          </g>
          <g stroke="white" strokeWidth="1" opacity="0.25">
            <path d="M460 225 L475 210 L490 198 L505 192 L520 198 L535 210 L548 225" fill="none" />
            <path d="M445 245 L458 230 L475 215" fill="none" />
            <path d="M550 230 L562 242 L572 258" fill="none" />
          </g>
        </g>

        {/* === FOOTHILLS WITH TREES === */}
        <g opacity="0.9">
          <path
            d="M0 400 Q80 370 160 385 Q240 365 320 378 Q400 360 500 372 Q580 358 660 370 Q740 355 820 368 Q900 360 1000 375 L1000 430 L0 430 Z"
            fill="url(#treeline)"
          />
          <g fill="#1f3a22" opacity="0.7">
            {[100, 180, 270, 360, 440, 530, 620, 710, 800, 890].map((x, i) => (
              <ellipse key={i} cx={x} cy={375 + (i % 3) * 3} rx={18 + (i % 2) * 8} ry={8 + (i % 3) * 3} />
            ))}
          </g>
        </g>

        {/* === CITY SKYLINE === */}
        <g opacity="0.7">
          <rect x="300" y="395" width="8" height="25" fill="#1a2540" />
          <rect x="315" y="385" width="12" height="35" fill="#1a2540" />
          <rect x="335" y="390" width="7" height="30" fill="#1a2540" />
          <rect x="350" y="380" width="15" height="40" fill="#1a2540" />
          <rect x="370" y="392" width="9" height="28" fill="#1a2540" />
          <rect x="385" y="388" width="11" height="32" fill="#1a2540" />
          <rect x="410" y="375" width="3" height="45" fill="#1a2540" />
          <ellipse cx="411" cy="375" rx="8" ry="3" fill="#1a2540" />
          <rect x="430" y="395" width="10" height="25" fill="#1a2540" />
          <rect x="450" y="385" width="14" height="35" fill="#1a2540" />
          <rect x="470" y="392" width="8" height="28" fill="#1a2540" />
          <rect x="490" y="398" width="6" height="22" fill="#1a2540" />
          <rect x="560" y="395" width="8" height="25" fill="#1a2540" />
          <rect x="580" y="390" width="10" height="30" fill="#1a2540" />
          <rect x="600" y="397" width="7" height="23" fill="#1a2540" />
          {!skyTheme.showSun && (
            <g fill="#ffd700" opacity="0.4">
              {[318, 353, 388, 433, 453, 583].map((x, i) => (
                <g key={i}>
                  <rect x={x} y={392 + (i % 3) * 5} width="2" height="2" rx="0.5" />
                  <rect x={x + 4} y={395 + (i % 2) * 4} width="2" height="2" rx="0.5" />
                </g>
              ))}
            </g>
          )}
        </g>

        {/* === FOREGROUND === */}
        <path
          d="M0 420 Q200 410 400 418 Q600 408 800 415 Q900 412 1000 418 L1000 500 L0 500 Z"
          fill="#0a1520"
        />

        {/* === WATER / PUGET SOUND === */}
        <rect x="0" y="435" width="1000" height="65" fill="url(#waterGrad)" />
        <g opacity="0.12" stroke="white" strokeWidth="0.8">
          <line x1="50" y1="450" x2="200" y2="450" />
          <line x1="300" y1="458" x2="500" y2="458" />
          <line x1="600" y1="448" x2="750" y2="448" />
          <line x1="150" y1="465" x2="350" y2="465" />
          <line x1="550" y1="470" x2="700" y2="470" />
          <line x1="800" y1="455" x2="950" y2="455" />
        </g>

        {/* === ATMOSPHERIC HAZE === */}
        <rect x="0" y="200" width="1000" height="300" fill="url(#hazeGrad)" opacity={isVisible ? 0.3 : 0.7} />

        {/* === CLOUDS === */}
        {skyTheme.cloudOpacity > 0.1 && (
          <g opacity={skyTheme.cloudOpacity} className="animate-clouds">
            <g transform="translate(100, 110)">
              <ellipse cx="0" cy="0" rx="80" ry="25" fill="white" opacity="0.45" />
              <ellipse cx="40" cy="-10" rx="55" ry="22" fill="white" opacity="0.55" />
              <ellipse cx="-30" cy="-5" rx="45" ry="18" fill="white" opacity="0.35" />
            </g>
            <g transform="translate(600, 140)">
              <ellipse cx="0" cy="0" rx="90" ry="28" fill="white" opacity="0.45" />
              <ellipse cx="50" cy="-12" rx="60" ry="24" fill="white" opacity="0.55" />
              <ellipse cx="-40" cy="-6" rx="50" ry="20" fill="white" opacity="0.35" />
            </g>
            <g transform="translate(380, 85)">
              <ellipse cx="0" cy="0" rx="65" ry="22" fill="white" opacity="0.35" />
              <ellipse cx="30" cy="-8" rx="45" ry="18" fill="white" opacity="0.45" />
            </g>
            {skyTheme.cloudOpacity > 0.5 && (
              <>
                <g transform="translate(200, 200)">
                  <ellipse cx="0" cy="0" rx="100" ry="30" fill="white" opacity="0.3" />
                  <ellipse cx="60" cy="-10" rx="70" ry="25" fill="white" opacity="0.35" />
                </g>
                <g transform="translate(750, 180)">
                  <ellipse cx="0" cy="0" rx="85" ry="26" fill="white" opacity="0.3" />
                  <ellipse cx="-40" cy="-8" rx="55" ry="20" fill="white" opacity="0.35" />
                </g>
              </>
            )}
          </g>
        )}

        {/* === FOG === */}
        {skyTheme.fogOpacity > 0 && (
          <rect
            x="0" y="280" width="1000" height="220"
            fill="url(#fogGrad)"
            opacity={skyTheme.fogOpacity}
          />
        )}

        {/* === VIGNETTE === */}
        <rect x="0" y="0" width="1000" height="500" fill="url(#hazeGrad)" opacity="0.15" />
      </svg>

      {/* Viewpoint label */}
      {viewpointName && (
        <div className="absolute bottom-4 left-4 glass-strong rounded-2xl px-4 py-3">
          <div className="text-[10px] text-white/35 uppercase tracking-[0.15em] font-medium mb-0.5">Viewing from</div>
          <div className="text-sm font-semibold text-white">{viewpointName}</div>
          {viewpointDistance && (
            <div className="text-xs text-white/30 mt-0.5">
              {viewpointDistance} mi to summit
            </div>
          )}
        </div>
      )}

      {/* Sky condition */}
      <div className="absolute top-4 right-4 glass-strong rounded-2xl px-4 py-2.5">
        <div className="text-[10px] text-white/35 uppercase tracking-[0.15em] font-medium mb-0.5">Sky</div>
        <div className="text-sm font-medium text-white">{skyTheme.label}</div>
      </div>

      {/* Mountain status badge */}
      <div
        className={`absolute top-4 left-4 rounded-2xl px-4 py-2.5 backdrop-blur-xl ${
          isVisible
            ? "bg-emerald-500/15 ring-1 ring-emerald-400/25"
            : "bg-red-500/15 ring-1 ring-red-400/25"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isVisible ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            {isVisible && (
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
            )}
          </div>
          <span
            className={`text-sm font-semibold ${
              isVisible ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {isVisible ? "Mountain is OUT" : "Hidden"}
          </span>
        </div>
      </div>
    </div>
  );
}
