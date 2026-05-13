"use client";

import { motion, Variants } from "framer-motion";
import SeattleVisibilityMap from "@/components/SeattleVisibilityMap";

interface NeighborhoodCardProps {
  allScores: { id: string; score: number }[];
  neighborhoodLabels: Record<string, string>;
  baseScore: number;
  onSelectNeighborhood: (id: string | null) => void;
  fadeUp: Variants;
}

export default function NeighborhoodCard({
  allScores,
  neighborhoodLabels,
  baseScore,
  onSelectNeighborhood,
  fadeUp,
}: NeighborhoodCardProps) {
  return (
    <motion.div variants={fadeUp} id="section-map" className="dash-card col-span-2">
      <div className="dash-card-header">Visibility by Neighborhood</div>

      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6 items-start">
        <SeattleVisibilityMap 
          scores={allScores} 
          labels={neighborhoodLabels} 
          baseScore={baseScore} 
          onSelectNeighborhood={onSelectNeighborhood} 
        />

        <div>
          <div className="space-y-2.5">
            {allScores.slice(0, 8).map((ns) => (
              <div key={ns.id} className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--text-secondary)" }}>
                  {neighborhoodLabels[ns.id] ?? ns.id}
                </span>
                <span
                  className="text-[10px] font-mono tabular font-semibold"
                  style={{
                    color: ns.score >= 70 ? "var(--accent)" : ns.score >= 50 ? "var(--accent-gold)" : "var(--accent-pink)",
                  }}
                >
                  {ns.score}%
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-5 pt-3" style={{ borderTop: "1px solid rgba(180,165,130,0.04)" }}>
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
        </div>
      </div>
    </motion.div>
  );
}
