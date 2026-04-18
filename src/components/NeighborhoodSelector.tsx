"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { NEIGHBORHOOD_LABELS } from "@/lib/visibility";

interface Props {
  selected: string | null;
  onSelect: (id: string | null) => void;
  scores?: { id: string; score: number }[];
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

export default function NeighborhoodSelector({ selected, onSelect, scores }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const sortedNeighborhoods = useMemo(() => {
    if (!scores || scores.length === 0) return NEIGHBORHOODS;
    const scoreMap = new Map(scores.map((s) => [s.id, s.score]));
    return [...NEIGHBORHOODS].sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));
  }, [scores]);

  const label = selected
    ? NEIGHBORHOOD_LABELS[selected] || selected
    : "Seattle-wide";

  const selectedScore = scores?.find((s) => s.id === selected)?.score;

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass hover:bg-white/[0.06] transition-all text-sm"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <MapPin className="w-3.5 h-3.5 text-blue-400/60" />
        {selected && (
          <span className="text-slate-500 text-xs">Your neighborhood:</span>
        )}
        <span className="text-white font-semibold text-sm">{label}</span>
        {selectedScore !== undefined && (
          <span className={`text-xs font-display font-bold ${selectedScore >= 50 ? "text-emerald-400/70" : "text-red-400/60"}`}>
            {selectedScore}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 left-0 z-50 glass rounded-xl py-1.5 min-w-[250px] shadow-xl ring-1 ring-white/[0.08] max-h-[320px] overflow-y-auto scrollbar-thin"
          role="listbox"
        >
          <button
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className={`w-full text-left px-4 py-2 text-xs transition-colors ${
              !selected
                ? "text-blue-300 bg-blue-500/10"
                : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
            }`}
            role="option"
            aria-selected={!selected}
          >
            Seattle-wide (default)
          </button>
          {sortedNeighborhoods.map((n) => {
            const nScore = scores?.find((s) => s.id === n.id)?.score;
            return (
              <button
                key={n.id}
                onClick={() => {
                  onSelect(n.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between ${
                  selected === n.id
                    ? "text-blue-300 bg-blue-500/10"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-300"
                }`}
                role="option"
                aria-selected={selected === n.id}
              >
                <span>
                  {n.label}
                  <span className="text-slate-600 ml-2">{n.elevation}</span>
                </span>
                {nScore !== undefined && (
                  <span className={`font-display font-bold text-[11px] ${nScore >= 50 ? "text-emerald-400/60" : "text-red-400/50"}`}>
                    {nScore}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
