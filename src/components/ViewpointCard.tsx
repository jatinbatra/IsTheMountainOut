"use client";

import { MapPin, Compass, ArrowUpRight } from "lucide-react";
import { Viewpoint } from "@/lib/viewpoints";

interface Props {
  viewpoint: Viewpoint;
  rank: number;
  isVisible: boolean;
  isSelected: boolean;
  onSelect: () => void;
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
      className={`w-full text-left rounded-xl p-4 border transition-all duration-200 ${
        isSelected
          ? "bg-blue-500/15 border-blue-400/40 shadow-lg shadow-blue-500/10"
          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
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
          </div>
          <p className="text-sm text-white/50 line-clamp-2 mb-2">
            {viewpoint.description}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {viewpoint.distanceMiles} mi to Rainier
            </span>
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3" />
              Look {viewpoint.direction}
            </span>
          </div>
        </div>
        <ArrowUpRight
          className={`w-5 h-5 shrink-0 transition-colors ${
            isSelected ? "text-blue-400" : "text-white/20"
          }`}
        />
      </div>
      <div className="mt-2 text-xs text-white/30">{viewpoint.bestFor}</div>
    </button>
  );
}
