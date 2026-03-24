"use client";

import { MapPin, Compass, ArrowUpRight, Map, Mountain, Eye } from "lucide-react";

interface ViewpointData {
  id: string;
  name: string;
  description: string;
  distanceMiles: number;
  direction: string;
  elevation: number;
  bestFor: string;
  lat: number;
  lon: number;
  region: string;
  mapsUrl: string;
  locationScore: number;
  locationConfidence: string;
  skyDescription: string;
}

interface Props {
  viewpoint: ViewpointData;
  rank: number;
  isVisible: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

function getConfidenceColor(confidence: string) {
  switch (confidence) {
    case "high":
      return { bg: "bg-emerald-500/15", text: "text-emerald-300", bar: "from-emerald-500 to-emerald-400", ring: "ring-emerald-400/20" };
    case "moderate":
      return { bg: "bg-amber-500/15", text: "text-amber-300", bar: "from-amber-500 to-yellow-400", ring: "ring-amber-400/20" };
    case "low":
      return { bg: "bg-orange-500/15", text: "text-orange-300", bar: "from-orange-500 to-orange-400", ring: "ring-orange-400/20" };
    default:
      return { bg: "bg-red-500/15", text: "text-red-300", bar: "from-red-500 to-red-400", ring: "ring-red-400/20" };
  }
}

function getRegionLabel(region: string) {
  switch (region) {
    case "seattle": return "Seattle";
    case "eastside": return "Eastside";
    case "south": return "South Sound";
    case "tacoma": return "Tacoma";
    case "north": return "North Sound";
    default: return region;
  }
}

export default function ViewpointCard({
  viewpoint,
  rank,
  isVisible,
  isSelected,
  onSelect,
}: Props) {
  const colors = getConfidenceColor(viewpoint.locationConfidence);

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-2xl p-4 transition-all duration-300 ${
        isSelected
          ? "bg-blue-500/10 ring-1 ring-blue-400/30 shadow-lg shadow-blue-500/5"
          : "glass glass-hover"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            <span
              className={`font-display text-xs font-bold px-2.5 py-1 rounded-lg ${
                rank === 1 && isVisible
                  ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20"
                  : "bg-white/[0.06] text-white/35"
              }`}
            >
              #{rank}
            </span>
            <h3 className="font-display font-bold text-white truncate text-[15px]">
              {viewpoint.name}
            </h3>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.04] text-white/25 ring-1 ring-white/[0.04] shrink-0">
              {getRegionLabel(viewpoint.region)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-white/40 line-clamp-2 mb-3 leading-relaxed">
            {viewpoint.description}
          </p>

          {/* Visibility score bar */}
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-white/30" />
                <span className="text-xs text-white/35 font-medium">Visibility from here</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-white">
                  {viewpoint.locationScore}
                </span>
                <span className="text-white/20 text-xs">/100</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} ring-1 ${colors.ring}`}>
                  {viewpoint.locationConfidence}
                </span>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-700`}
                style={{ width: `${viewpoint.locationScore}%` }}
              />
            </div>
          </div>

          {/* Sky description */}
          <div className="mb-3 p-3 rounded-xl bg-white/[0.02] ring-1 ring-white/[0.04]">
            <div className="flex items-start gap-2.5">
              <Mountain className="w-3.5 h-3.5 text-blue-400/40 mt-0.5 shrink-0" />
              <p className="text-xs text-white/35 leading-relaxed italic">
                {viewpoint.skyDescription}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/30">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {viewpoint.distanceMiles} mi
            </span>
            <span className="flex items-center gap-1.5">
              <Compass className="w-3 h-3" />
              {viewpoint.direction}
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3 h-3" />
              {viewpoint.elevation.toLocaleString()} ft
            </span>
          </div>

          {/* Best for + Maps link */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
            <span className="text-xs text-white/20">{viewpoint.bestFor}</span>
            <a
              href={viewpoint.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs text-blue-400/60 hover:text-blue-300 transition-colors font-medium"
            >
              <Map className="w-3 h-3" />
              Maps
            </a>
          </div>
        </div>
      </div>
    </button>
  );
}
