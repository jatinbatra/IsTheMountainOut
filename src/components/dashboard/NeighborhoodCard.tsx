"use client";

import { motion, Variants } from "framer-motion";
import SeattleVisibilityMap from "@/components/SeattleVisibilityMap";

interface NeighborhoodCardProps {
  allScores: { id: string; score: number }[];
  neighborhoodLabels: Record<string, string>;
  baseScore: number;
  onSelectNeighborhood: (id: string | null) => void;
  fadeUp: Variants;
  className?: string;
}

export default function NeighborhoodCard({
  allScores,
  neighborhoodLabels,
  baseScore,
  onSelectNeighborhood,
  fadeUp,
  className = "",
}: NeighborhoodCardProps) {
  return (
    <motion.div variants={fadeUp} id="section-map" className={`dash-card ${className}`}>
      <div className="dash-card-header">By Neighborhood</div>

      {/* Map fills the full card width so it reads clearly */}
      <SeattleVisibilityMap
        scores={allScores}
        labels={neighborhoodLabels}
        baseScore={baseScore}
        onSelectNeighborhood={onSelectNeighborhood}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 pt-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
        {[
          { label: "90–100%", c: "#5a9e6a" },
          { label: "70–89%",  c: "#4a8858" },
          { label: "50–69%",  c: "#d4a373" },
          { label: "30–49%",  c: "#b07848" },
          { label: "0–29%",   c: "#c47d8a" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-[8px]" style={{ color: "var(--text-tertiary)" }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.c }} />
            {l.label}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
