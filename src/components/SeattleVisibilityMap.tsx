"use client";

import { useState } from "react";

interface Props {
  scores: { id: string; score: number }[];
  labels: Record<string, string>;
  baseScore: number;
  onSelectNeighborhood?: (id: string) => void;
}

const NEIGHBORHOODS: {
  id: string;
  path: string;
  labelX: number;
  labelY: number;
}[] = [
  {
    id: "ballard",
    path: "M90,20 L160,20 L160,55 L140,60 L120,58 L90,55 Z",
    labelX: 125, labelY: 40,
  },
  {
    id: "fremont",
    path: "M140,60 L175,55 L180,75 L155,80 L140,75 Z",
    labelX: 158, labelY: 68,
  },
  {
    id: "wallingford",
    path: "M155,55 L195,50 L198,72 L180,75 L155,70 Z",
    labelX: 176, labelY: 62,
  },
  {
    id: "green-lake",
    path: "M160,20 L220,18 L225,48 L195,50 L160,52 Z",
    labelX: 192, labelY: 35,
  },
  {
    id: "u-district",
    path: "M225,18 L270,22 L268,65 L240,70 L225,55 Z",
    labelX: 248, labelY: 42,
  },
  {
    id: "magnolia",
    path: "M30,60 L90,55 L92,110 L75,125 L35,120 L25,90 Z",
    labelX: 60, labelY: 90,
  },
  {
    id: "queen-anne",
    path: "M92,58 L155,55 L155,80 L152,105 L125,115 L92,110 Z",
    labelX: 122, labelY: 85,
  },
  {
    id: "capitol-hill",
    path: "M195,80 L240,75 L248,120 L240,145 L200,140 L195,105 Z",
    labelX: 218, labelY: 110,
  },
  {
    id: "downtown",
    path: "M125,115 L155,105 L195,105 L195,155 L170,165 L130,160 L120,140 Z",
    labelX: 158, labelY: 135,
  },
  {
    id: "central-district",
    path: "M200,140 L245,145 L248,185 L215,190 L200,175 Z",
    labelX: 225, labelY: 165,
  },
  {
    id: "sodo",
    path: "M130,160 L170,165 L195,155 L200,195 L175,205 L140,200 Z",
    labelX: 168, labelY: 182,
  },
  {
    id: "beacon-hill",
    path: "M200,195 L215,190 L248,185 L255,225 L220,235 L200,225 Z",
    labelX: 228, labelY: 210,
  },
  {
    id: "west-seattle",
    path: "M30,170 L90,160 L140,200 L135,250 L80,260 L30,240 Z",
    labelX: 88, labelY: 215,
  },
  {
    id: "columbia-city",
    path: "M220,235 L255,225 L262,265 L230,270 Z",
    labelX: 242, labelY: 250,
  },
  {
    id: "georgetown",
    path: "M140,200 L200,195 L200,230 L160,240 L140,235 Z",
    labelX: 170, labelY: 218,
  },
  {
    id: "leschi",
    path: "M248,120 L280,115 L285,165 L248,170 Z",
    labelX: 265, labelY: 142,
  },
];

function scoreColor(s: number): string {
  if (s >= 90) return "#5a9e6a";
  if (s >= 70) return "#4a8858";
  if (s >= 50) return "#d4a373";
  if (s >= 30) return "#b07848";
  return "#c47d8a";
}

export default function SeattleVisibilityMap({ scores, labels, onSelectNeighborhood }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const scoreMap = new Map(scores.map((s) => [s.id, s.score]));

  return (
    <div className="seattle-map-svg">
      <svg viewBox="0 0 320 290" className="w-full">
        <defs>
          <filter id="map-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect width="320" height="290" fill="#1e1b16" rx="12" />

        {/* Water bodies */}
        <path
          d="M0,0 L28,0 L30,40 Q35,90 25,140 Q18,190 28,250 L20,290 L0,290 Z"
          fill="#1a2530" opacity="0.7"
        />
        {/* Lake Union */}
        <ellipse cx="170" cy="80" rx="18" ry="12" fill="#1a2530" opacity="0.6" />
        {/* Lake Washington */}
        <path
          d="M280,10 L320,10 L320,280 L280,280 Q275,200 285,140 Q290,80 280,10 Z"
          fill="#1a2530" opacity="0.6"
        />

        {/* Subtle grid */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`h${i}`} x1="0" y1={i * 42 + 15} x2="320" y2={i * 42 + 15} stroke="rgba(180,150,100,0.025)" strokeWidth="0.5" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line key={`v${i}`} x1={i * 42 + 20} y1="0" x2={i * 42 + 20} y2="290" stroke="rgba(180,150,100,0.025)" strokeWidth="0.5" />
        ))}

        {/* Neighborhood polygons */}
        {NEIGHBORHOODS.map((hood) => {
          const s = scoreMap.get(hood.id) ?? 50;
          const color = scoreColor(s);
          const isHovered = hovered === hood.id;
          const name = labels[hood.id] ?? hood.id;

          return (
            <g
              key={hood.id}
              className="map-region"
              onMouseEnter={() => setHovered(hood.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectNeighborhood?.(hood.id)}
            >
              <path
                d={hood.path}
                fill={color}
                fillOpacity={isHovered ? 0.55 : 0.3}
                stroke={color}
                strokeWidth={isHovered ? 1.8 : 1}
                strokeOpacity={isHovered ? 0.9 : 0.5}
                strokeLinejoin="round"
              />
              <text
                x={hood.labelX}
                y={hood.labelY - 4}
                textAnchor="middle"
                className="map-label"
                fill={isHovered ? "#f5f0e6" : "rgba(228,221,208,0.5)"}
                fontSize="6"
                fontWeight="600"
                letterSpacing="0.04em"
              >
                {name.toUpperCase()}
              </text>
              <text
                x={hood.labelX}
                y={hood.labelY + 7}
                textAnchor="middle"
                className="map-label"
                fill={isHovered ? "#f5f0e6" : color}
                fontSize={isHovered ? "11" : "9"}
                fontWeight="700"
                opacity={isHovered ? 1 : 0.85}
              >
                {s}%
              </text>
            </g>
          );
        })}

        {/* Water labels */}
        <text x="14" y="145" textAnchor="middle" fill="rgba(122,174,212,0.2)" fontSize="6" fontWeight="600" letterSpacing="0.1em" transform="rotate(-90, 14, 145)">
          PUGET SOUND
        </text>
        <text x="300" y="145" textAnchor="middle" fill="rgba(122,174,212,0.15)" fontSize="5.5" fontWeight="600" letterSpacing="0.08em" transform="rotate(90, 300, 145)">
          LAKE WASHINGTON
        </text>
        <text x="170" y="83" textAnchor="middle" fill="rgba(122,174,212,0.15)" fontSize="4.5" fontWeight="600">
          LAKE UNION
        </text>

        {/* Rainier direction */}
        <line x1="240" y1="268" x2="295" y2="280" stroke="rgba(212,163,115,0.15)" strokeWidth="0.8" strokeDasharray="3 3" />
        <text x="298" y="283" fill="rgba(212,163,115,0.25)" fontSize="5.5" fontWeight="600">
          MT. RAINIER →
        </text>

        {/* Hover tooltip */}
        {hovered && (() => {
          const hood = NEIGHBORHOODS.find((h) => h.id === hovered);
          if (!hood) return null;
          const s = scoreMap.get(hood.id) ?? 0;
          const name = labels[hood.id] ?? hood.id;
          return (
            <g filter="url(#map-glow)">
              <rect
                x={hood.labelX - 48} y={hood.labelY - 30}
                width="96" height="22" rx="6"
                fill="rgba(21,18,16,0.94)"
                stroke="rgba(180,150,100,0.2)" strokeWidth="0.8"
              />
              <text
                x={hood.labelX} y={hood.labelY - 16}
                textAnchor="middle" dominantBaseline="middle"
                fill="#f5f0e6" fontSize="7.5" fontWeight="600"
                className="map-label"
              >
                {name} · {s}%
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
