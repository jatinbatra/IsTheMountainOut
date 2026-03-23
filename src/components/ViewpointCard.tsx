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
      return { bg: "bg-green-500/20", text: "text-green-300", bar: "bg-green-400" };
    case "moderate":
      return { bg: "bg-yellow-500/20", text: "text-yellow-300", bar: "bg-yellow-400" };
    case "low":
      return { bg: "bg-orange-500/20", text: "text-orange-300", bar: "bg-orange-400" };
    default:
      return { bg: "bg-red-500/20", text: "text-red-300", bar: "bg-red-400" };
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
      className={`w-full text-left rounded-xl p-4 border transition-all duration-200 ${
        isSelected
          ? "bg-blue-500/15 border-blue-400/40 shadow-lg shadow-blue-500/10"
          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header row: rank + name + region badge */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                rank === 1 && isVisible
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-white/10 text-white/40"
              }`}
            >
              #{rank}
            </span>
            <h3 className="font-semibold text-white truncate">
              {viewpoint.name}
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 shrink-0">
              {getRegionLabel(viewpoint.region)}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-white/50 line-clamp-2 mb-3">
            {viewpoint.description}
          </p>

          {/* Per-location confidence bar */}
          <div className="mb-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-white/40" />
                <span className="text-xs text-white/50">Visibility from here</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">
                  {viewpoint.locationScore}/100
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                  {viewpoint.locationConfidence}
                </span>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                style={{ width: `${viewpoint.locationScore}%` }}
              />
            </div>
          </div>

          {/* Sky description */}
          <div className="mb-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="flex items-start gap-2">
              <Mountain className="w-3.5 h-3.5 text-blue-300/50 mt-0.5 shrink-0" />
              <p className="text-xs text-white/40 leading-relaxed italic">
                {viewpoint.skyDescription}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {viewpoint.distanceMiles} mi to summit
            </span>
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3" />
              Look {viewpoint.direction}
            </span>
            <span className="flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              {viewpoint.elevation.toLocaleString()} ft elev
            </span>
          </div>

          {/* Best for + Maps link */}
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-xs text-white/25">{viewpoint.bestFor}</span>
            <a
              href={viewpoint.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-blue-400/70 hover:text-blue-300 transition-colors"
            >
              <Map className="w-3 h-3" />
              Open in Maps
            </a>
          </div>
        </div>
      </div>
    </button>
  );
}
