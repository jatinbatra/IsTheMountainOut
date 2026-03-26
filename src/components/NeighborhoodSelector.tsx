"use client";

import { MapPin } from "lucide-react";

interface Props {
  selected: string | null;
  onSelect: (id: string | null) => void;
}

const NEIGHBORHOODS = [
  { id: "capitol-hill", label: "Capitol Hill", elevation: "443 ft" },
  { id: "queen-anne", label: "Queen Anne", elevation: "456 ft" },
  { id: "ballard", label: "Ballard", elevation: "40 ft" },
  { id: "fremont", label: "Fremont", elevation: "52 ft" },
  { id: "downtown", label: "Downtown", elevation: "20 ft" },
  { id: "beacon-hill", label: "Beacon Hill", elevation: "350 ft" },
  { id: "west-seattle", label: "West Seattle", elevation: "280 ft" },
  { id: "columbia-city", label: "Columbia City", elevation: "250 ft" },
  { id: "greenwood", label: "Greenwood", elevation: "130 ft" },
  { id: "u-district", label: "U-District", elevation: "80 ft" },
  { id: "bellevue", label: "Bellevue", elevation: "200 ft" },
  { id: "kirkland", label: "Kirkland", elevation: "100 ft" },
  { id: "tacoma", label: "Tacoma", elevation: "50 ft" },
  { id: "renton", label: "Renton", elevation: "180 ft" },
];

export default function NeighborhoodSelector({ selected, onSelect }: Props) {
  return (
    <div className="glass rounded-2xl px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400/60" />
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Your Neighborhood
          </span>
        </div>
        {selected && (
          <button
            onClick={() => onSelect(null)}
            className="text-[10px] text-white/25 hover:text-white/40 transition-colors font-medium"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {NEIGHBORHOODS.map((n) => (
          <button
            key={n.id}
            onClick={() => onSelect(selected === n.id ? null : n.id)}
            className={`text-xs font-medium px-3 py-1.5 rounded-xl transition-all ${
              selected === n.id
                ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/25"
                : "text-white/30 hover:text-white/45 hover:bg-white/[0.04]"
            }`}
            title={`Elevation: ${n.elevation}`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {selected && (
        <p className="text-[10px] text-white/20">
          Score adjusted for local elevation, fog exposure, and building obstructions
        </p>
      )}
    </div>
  );
}
