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
    case "high": return "text-[color:var(--accent-clear)]";
    case "moderate": return "text-[color:var(--accent)]";
    case "low": return "text-[color:var(--accent-fog)]";
    default: return "text-[color:var(--accent-fog)]";
  }
}

function getBarColor(confidence: string) {
  switch (confidence) {
    case "high": return "bg-[color:var(--accent-clear)]/60";
    case "moderate": return "bg-[color:var(--accent)]/60";
    case "low": return "bg-[color:var(--accent-fog)]/60";
    default: return "bg-[color:var(--accent-fog)]/50";
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
          ? "bg-[color:var(--type-1)]/[0.03] border-l-2 border-[color:var(--accent)] pl-4 pr-4 py-4"
          : "border-l-2 border-transparent pl-4 pr-4 py-3 hover:bg-[color:var(--type-1)]/[0.02]"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`font-mono text-xs font-bold shrink-0 ${
            rank === 1 && isVisible ? "text-[color:var(--accent)]" : "text-[color:var(--type-4)]"
          }`}>
            {String(rank).padStart(2, "0")}
          </span>
          <h3 className="font-display font-medium text-[color:var(--type-1)] text-sm truncate">
            {viewpoint.name}
          </h3>
          <span className="ticker shrink-0">
            {getRegionLabel(viewpoint.region)}
          </span>
        </div>

        <div className="flex items-baseline gap-1 shrink-0">
          <span className="font-display text-lg font-light text-[color:var(--type-1)] tabular">{viewpoint.locationScore}</span>
          <span className={`ticker ${getConfidenceColor(viewpoint.locationConfidence)}`}>
            {viewpoint.locationConfidence}
          </span>
        </div>
      </div>

      <div className="w-full h-px bg-[var(--rule)] mb-2.5 ml-7 relative overflow-hidden">
        <div
          className={`absolute left-0 top-[-1px] h-[3px] ${getBarColor(viewpoint.locationConfidence)} transition-all duration-500`}
          style={{ width: `${viewpoint.locationScore}%` }}
        />
      </div>

      {isSelected && (
        <p className="text-xs text-[color:var(--type-3)] leading-relaxed mb-2.5 ml-7 font-display italic font-light">
          {viewpoint.skyDescription}
        </p>
      )}

      <div className="flex items-center gap-4 ml-7 font-mono text-[11px] text-[color:var(--type-4)]">
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
            className="flex items-center gap-1 text-[color:var(--accent)] hover:text-[color:var(--type-1)] transition-colors ml-auto"
          >
            <Map className="w-2.5 h-2.5" />
            Maps
          </a>
        )}
      </div>
    </button>
  );
}
