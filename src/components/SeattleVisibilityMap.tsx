"use client";

import { useState } from "react";

interface Props {
  scores: { id: string; score: number }[];
  labels: Record<string, string>;
  baseScore: number;
  onSelectNeighborhood?: (id: string) => void;
}

const REGIONS: {
  id: string;
  cx: number;
  cy: number;
  r: number;
}[] = [
  { id: "capitol-hill",     cx: 218, cy: 138, r: 18 },
  { id: "queen-anne",        cx: 175, cy: 115, r: 18 },
  { id: "downtown",          cx: 188, cy: 155, r: 18 },
  { id: "ballard",           cx: 145, cy: 80,  r: 18 },
  { id: "fremont",           cx: 170, cy: 90,  r: 16 },
  { id: "green-lake",        cx: 195, cy: 62,  r: 16 },
  { id: "u-district",        cx: 220, cy: 78,  r: 16 },
  { id: "wallingford",       cx: 195, cy: 80,  r: 14 },
  { id: "west-seattle",      cx: 140, cy: 210, r: 18 },
  { id: "columbia-city",     cx: 245, cy: 210, r: 16 },
  { id: "beacon-hill",       cx: 220, cy: 190, r: 16 },
  { id: "sodo",              cx: 195, cy: 188, r: 14 },
  { id: "central-district",  cx: 230, cy: 160, r: 14 },
  { id: "magnolia",          cx: 130, cy: 120, r: 16 },
  { id: "leschi",            cx: 248, cy: 155, r: 14 },
  { id: "georgetown",        cx: 210, cy: 215, r: 14 },
];

function scoreColor(s: number): string {
  if (s >= 90) return "#2db87a";
  if (s >= 70) return "#4a9060";
  if (s >= 50) return "#d4a373";
  if (s >= 30) return "#c06828";
  return "#ff5cad";
}

export default function SeattleVisibilityMap({ scores, labels, onSelectNeighborhood }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const scoreMap = new Map(scores.map((s) => [s.id, s.score]));

  const hoveredRegion = hovered ? REGIONS.find((r) => r.id === hovered) : null;
  const hoveredScore = hovered ? scoreMap.get(hovered) ?? 0 : 0;
  const hoveredName = hovered ? labels[hovered] ?? hovered : "";

  return (
    <div className="seattle-map-svg">
      <svg viewBox="0 0 380 280" className="w-full">
        {/* Water / Puget Sound */}
        <rect width="380" height="280" fill="#0a0d14" rx="12" />
        <path
          d="M0,0 L95,0 L95,60 Q100,120 85,180 Q75,230 90,280 L0,280 Z"
          fill="#0c1520"
          opacity="0.7"
        />
        <path
          d="M270,0 L380,0 L380,160 Q350,140 330,160 Q310,180 290,170 Q275,162 270,140 Z"
          fill="#0c1520"
          opacity="0.5"
        />
        {/* Lake Washington (east) */}
        <ellipse cx="300" cy="140" rx="35" ry="90" fill="#0c1520" opacity="0.5" />

        {/* Subtle grid */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`h${i}`} x1="0" y1={i * 40 + 20} x2="380" y2={i * 40 + 20} stroke="rgba(180,150,100,0.03)" strokeWidth="0.5" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <line key={`v${i}`} x1={i * 40 + 30} y1="0" x2={i * 40 + 30} y2="280" stroke="rgba(180,150,100,0.03)" strokeWidth="0.5" />
        ))}

        {/* Downtown Seattle indicator */}
        <text x="188" y="170" textAnchor="middle" fill="rgba(180,150,100,0.15)" fontSize="5" fontWeight="700" letterSpacing="0.1em">
          DOWNTOWN
        </text>

        {/* Rainier direction arrow */}
        <line x1="280" y1="250" x2="340" y2="270" stroke="rgba(212,163,115,0.12)" strokeWidth="1" strokeDasharray="4 4" />
        <text x="345" y="272" fill="rgba(212,163,115,0.2)" fontSize="6" fontWeight="600">
          MT. RAINIER →
        </text>

        {/* Neighborhood circles */}
        {REGIONS.map((region) => {
          const s = scoreMap.get(region.id) ?? 50;
          const color = scoreColor(s);
          const isHovered = hovered === region.id;
          return (
            <g
              key={region.id}
              className="map-region"
              onMouseEnter={() => setHovered(region.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectNeighborhood?.(region.id)}
            >
              {/* Glow */}
              <circle
                cx={region.cx} cy={region.cy} r={region.r + 6}
                fill={color} opacity={isHovered ? 0.12 : 0.04}
              />
              {/* Fill */}
              <circle
                cx={region.cx} cy={region.cy} r={region.r}
                fill={color} opacity={isHovered ? 0.5 : 0.25}
                stroke={color} strokeWidth={isHovered ? 2 : 1}
                strokeOpacity={isHovered ? 0.8 : 0.4}
              />
              {/* Score label */}
              <text
                x={region.cx} y={region.cy + 1}
                textAnchor="middle" dominantBaseline="middle"
                className="map-label"
                fill={isHovered ? "#ede6d8" : color}
                fontSize={isHovered ? "11" : "9"}
                fontWeight="700"
                opacity={isHovered ? 1 : 0.8}
              >
                {s}%
              </text>
            </g>
          );
        })}

        {/* Hover tooltip */}
        {hoveredRegion && (
          <g>
            <rect
              x={hoveredRegion.cx - 45} y={hoveredRegion.cy - hoveredRegion.r - 32}
              width="90" height="24" rx="8"
              fill="rgba(12,10,7,0.9)"
              stroke="rgba(180,150,100,0.15)" strokeWidth="1"
            />
            <text
              x={hoveredRegion.cx} y={hoveredRegion.cy - hoveredRegion.r - 18}
              textAnchor="middle" dominantBaseline="middle"
              fill="#ede6d8" fontSize="8" fontWeight="600"
              className="map-label"
            >
              {hoveredName} · {hoveredScore}%
            </text>
          </g>
        )}

        {/* Labels: Puget Sound & Lake Washington */}
        <text x="50" y="140" textAnchor="middle" fill="rgba(91,155,213,0.2)" fontSize="7" fontWeight="600" letterSpacing="0.12em" transform="rotate(-90, 50, 140)">
          PUGET SOUND
        </text>
        <text x="300" y="50" textAnchor="middle" fill="rgba(91,155,213,0.15)" fontSize="6" fontWeight="600" letterSpacing="0.1em">
          LAKE WASHINGTON
        </text>
      </svg>
    </div>
  );
}
