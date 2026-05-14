"use client";

import { motion, Variants } from "framer-motion";

interface Factor {
  label: string;
  desc: string;
  value: number;
  status: string;
}

interface FactorsCardProps {
  isVisible: boolean;
  factors: Factor[];
  fadeUp: Variants;
  className?: string;
}

export default function FactorsCard({
  isVisible,
  factors,
  fadeUp,
  className = "",
}: FactorsCardProps) {
  return (
    <motion.div variants={fadeUp} className={`dash-card ${className}`}>
      <div className="dash-card-header">
        Why the Mountain is {isVisible ? "Out" : "Hidden"}
      </div>

      <div>
        {factors.map((f) => (
          <div key={f.label} className="factor-row">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{f.label}</p>
                <p className="text-[9.5px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{f.desc}</p>
              </div>
              <span
                className="text-[9.5px] font-bold tracking-wider flex-shrink-0"
                style={{
                  color: f.status === "EXCELLENT" || f.status === "GOOD" ? "var(--accent)"
                    : f.status === "FAIR" ? "var(--accent-gold)"
                    : "var(--accent-pink)",
                }}
              >
                {f.status}
              </span>
            </div>
            <div className="factor-bar">
              <div
                className={`factor-bar-fill ${f.value >= 70 ? "good" : f.value >= 40 ? "warning" : "critical"}`}
                style={{ width: `${f.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        className="mt-4 text-[9.5px] uppercase tracking-wider font-mono flex items-center gap-1 transition-colors hover:opacity-80"
        style={{ color: "var(--accent-gold)" }}
      >
        How it works →
      </button>
    </motion.div>
  );
}
