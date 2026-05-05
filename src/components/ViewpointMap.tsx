"use client";

import React from "react";

interface Viewpoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  score: number;
  region: string;
}

interface Props {
  viewpoints: Viewpoint[];
  selectedId?: string;
  onSelectViewpoint?: (id: string) => void;
  baseScore: number;
}

export default function ViewpointMap({ viewpoints, selectedId, onSelectViewpoint, baseScore }: Props) {
  // Seattle metro bounding box (rough)
  const minLat = 47.2;
  const maxLat = 47.9;
  const minLon = -122.5;
  const maxLon = -121.8;

  // Map coordinates (lat/lon) to SVG view box (0-400, 0-300)
  const latToY = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * 300;
  const lonToX = (lon: number) => ((lon - minLon) / (maxLon - minLon)) * 400;

  // Color function: Green (visible) → Yellow (peeking) → Red (hiding)
  const scoreToColor = (score: number): string => {
    if (score >= 70) return "#10b981"; // emerald
    if (score >= 50) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  // Render visibility heatmap grid (simplified topography)
  const gridSize = 40;
  const heatmapCells: React.ReactNode[] = [];

  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 7.5; j++) {
      const lat = maxLat - (i / 10) * (maxLat - minLat);
      const lon = minLon + (j / 7.5) * (maxLon - minLon);

      // Calculate cell visibility based on base score and proximity to Mt. Rainier
      // Cells closer to the south (toward Rainier) get better visibility
      const distanceToRainier = Math.abs(lat - 46.85);
      const proximityBonus = Math.max(0, 20 - distanceToRainier * 20);
      const cellScore = Math.min(100, baseScore + proximityBonus);

      const x = lonToX(lon);
      const y = latToY(lat);
      const color = scoreToColor(cellScore);

      heatmapCells.push(
        <rect
          key={`cell-${i}-${j}`}
          x={x}
          y={y}
          width={gridSize}
          height={gridSize}
          fill={color}
          opacity="0.4"
        />
      );
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Map Title */}
      <h3 className="text-sm font-display text-[var(--text-primary)] tracking-tight">
        Visibility Across Seattle Metro
      </h3>

      {/* SVG Map */}
      <div className="border border-[var(--border-light)] rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
        <svg viewBox="0 0 400 300" className="w-full h-auto" role="img" aria-label="Seattle visibility heatmap">
          {/* Background */}
          <rect width="400" height="300" fill="var(--bg-secondary)" />

          {/* Topographic pattern overlay */}
          <defs>
            <pattern id="topo-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="40" y2="40" stroke="rgba(0,0,0,0.02)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="400" height="300" fill="url(#topo-pattern)" />

          {/* Heatmap cells */}
          {heatmapCells}

          {/* Viewpoint markers */}
          {viewpoints.map((vp) => {
            const x = lonToX(vp.lon);
            const y = latToY(vp.lat);
            const isSelected = vp.id === selectedId;

            return (
              <g key={vp.id} onClick={() => onSelectViewpoint?.(vp.id)} style={{ cursor: "pointer" }}>
                {/* Glow effect for selected */}
                {isSelected && (
                  <circle cx={x} cy={y} r="16" fill="var(--season-accent)" opacity="0.2" />
                )}

                {/* Marker circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={scoreToColor(vp.score)}
                  stroke={isSelected ? "var(--season-accent)" : "white"}
                  strokeWidth={isSelected ? "3" : "2"}
                  style={{
                    transition: "all 0.2s ease",
                  }}
                />

                {/* Tooltip text (on hover via title element) */}
                <title>{`${vp.name}: ${vp.score} visibility`}</title>
              </g>
            );
          })}

          {/* Mt. Rainier indicator (bottom right) */}
          <g>
            <circle cx="350" cy="240" r="4" fill="#8b6f47" opacity="0.6" />
            <text x="360" y="245" fontSize="10" fill="var(--text-tertiary)" className="font-mono">
              Mt. Rainier
            </text>
          </g>

          {/* Cardinal directions */}
          <text x="10" y="20" fontSize="10" fill="var(--text-tertiary)" className="font-mono">
            N
          </text>
          <text x="385" y="290" fontSize="10" fill="var(--text-tertiary)" className="font-mono">
            E
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-xs font-mono text-[var(--text-secondary)]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#10b981] rounded" />
          <span>Visible (70+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#f59e0b] rounded" />
          <span>Peeking (50-69)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#ef4444] rounded" />
          <span>Hidden (&lt;50)</span>
        </div>
      </div>
    </div>
  );
}
