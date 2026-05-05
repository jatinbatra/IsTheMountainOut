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
    case "high": return "text-[#2d8a4e]";
    case "moderate": return "text-[#d4a843]";
    case "low": return "text-[color:var(--type-4)]";
    default: return "text-[color:var(--type-4)]";
  }
}

function getBarColor(confidence: string) {
  switch (confidence) {
    case "high": return "bg-[#2d8a4e]";
    case "moderate": return "bg-[#d4a843]";
    case "low": return "bg-gray-200";
    default: return "bg-gray-200";
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
      className={`w-full text-left transition-all duration-200 px-3 py-2 ${
        isSelected
          ? "bg-[color:var(--accent)]/[0.04]"
          : "hover:bg-[var(--ink-deep)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
            rank === 1 && isVisible
              ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
              : "bg-[var(--ink-deep)] text-[color:var(--type-4)]"
          }`}>
            {rank}
          </span>
          <h3 className="font-medium text-[color:var(--type-1)] text-sm truncate">
            {viewpoint.name}
          </h3>
          <span className="text-[10px] text-[color:var(--type-4)] shrink-0">
            {getRegionLabel(viewpoint.region)}
          </span>
        </div>

        <div className="flex items-baseline gap-1 shrink-0">
          <span className="font-display text-lg font-light text-[color:var(--type-1)] tabular">{viewpoint.locationScore}</span>
          <span className={`text-[10px] font-medium ${getConfidenceColor(viewpoint.locationConfidence)}`}>
            {viewpoint.locationConfidence}
          </span>
        </div>
      </div>

      <div className="ml-8 mb-2">
        <div className="w-full h-1.5 rounded-full bg-[var(--ink-deep)] overflow-hidden">
          <div
            className={`h-full rounded-full ${getBarColor(viewpoint.locationConfidence)} transition-all duration-500`}
            style={{ width: `${viewpoint.locationScore}%` }}
          />
        </div>
      </div>

      {isSelected && (
        <p className="text-xs text-[color:var(--type-3)] leading-relaxed mb-2 ml-8 italic">
          {viewpoint.skyDescription}
        </p>
      )}

      <div className="flex items-center gap-3 ml-8 text-[10px] text-[color:var(--type-4)]">
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
