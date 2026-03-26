"use client";

import { MapPin, Compass, ArrowUpRight, Map } from "lucide-react";

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
    case "high": return "text-emerald-400/70";
    case "moderate": return "text-amber-400/70";
    case "low": return "text-orange-400/70";
    default: return "text-red-400/70";
  }
}

function getBarColor(confidence: string) {
  switch (confidence) {
    case "high": return "bg-emerald-400/60";
    case "moderate": return "bg-amber-400/60";
    case "low": return "bg-orange-400/60";
    default: return "bg-red-400/50";
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
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left transition-all duration-200 ${
        isSelected
          ? "bg-white/[0.04] border-l-2 border-blue-400/50 pl-4 pr-4 py-4"
          : "border-l-2 border-transparent pl-4 pr-4 py-3 hover:bg-white/[0.02]"
      }`}
    >
      {/* Top row: rank, name, score */}
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`font-mono text-xs font-bold shrink-0 ${
            rank === 1 && isVisible ? "text-amber-400/70" : "text-white/15"
          }`}>
            {String(rank).padStart(2, "0")}
          </span>
          <h3 className="font-display font-bold text-white text-sm truncate">
            {viewpoint.name}
          </h3>
          <span className="text-[9px] text-white/15 font-medium shrink-0">
            {getRegionLabel(viewpoint.region)}
          </span>
        </div>

        <div className="flex items-baseline gap-1 shrink-0">
          <span className="font-display text-lg font-black text-white">{viewpoint.locationScore}</span>
          <span className={`text-[10px] font-bold uppercase ${getConfidenceColor(viewpoint.locationConfidence)}`}>
            {viewpoint.locationConfidence}
          </span>
        </div>
      </div>

      {/* Score bar — thin, no container */}
      <div className="w-full h-[2px] rounded-full bg-white/[0.04] mb-2.5 ml-7">
        <div
          className={`h-full rounded-full ${getBarColor(viewpoint.locationConfidence)} transition-all duration-500`}
          style={{ width: `${viewpoint.locationScore}%` }}
        />
      </div>

      {/* Sky description — only when selected */}
      {isSelected && (
        <p className="text-xs text-white/30 leading-relaxed mb-2.5 ml-7 italic">
          {viewpoint.skyDescription}
        </p>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 ml-7 text-[11px] text-white/20">
        <span className="flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5" />
          {viewpoint.distanceMiles}mi
        </span>
        <span className="flex items-center gap-1">
          <Compass className="w-2.5 h-2.5" />
          {viewpoint.direction}
        </span>
        <span className="flex items-center gap-1">
          <ArrowUpRight className="w-2.5 h-2.5" />
          {viewpoint.elevation.toLocaleString()}ft
        </span>
        {isSelected && (
          <a
            href={viewpoint.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-blue-400/40 hover:text-blue-300 transition-colors ml-auto"
          >
            <Map className="w-2.5 h-2.5" />
            Maps
          </a>
        )}
      </div>
    </button>
  );
}
