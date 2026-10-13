"use client";

import { useState } from "react";
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
  /** Context such as a location adjustment or night caveat. */
  note?: string;
}

export default function FactorsCard({
  isVisible,
  factors,
  fadeUp,
  className = "",
  note,
}: FactorsCardProps) {
  const [open, setOpen] = useState(false);
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

      {note && (
        <p className="mt-3 text-[10.5px] leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
          {note}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-4 text-[9.5px] uppercase tracking-wider font-mono flex items-center gap-1 transition-colors hover:opacity-80"
        style={{ color: "var(--accent-gold)" }}
      >
        How it works {open ? "↑" : "→"}
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <p>
            Every 15 minutes we pull live conditions from Open-Meteo for the air between Seattle and the
            mountain, plus Seattle air quality, and add up points out of 100:
          </p>
          <p>
            <b>Low clouds 40</b> · <b>mid clouds 20</b> · <b>high clouds 10</b> · <b>visibility distance 20</b> (full
            marks at 90 km, roughly the distance to Rainier) · <b>air quality 10</b>. Fog removes 25, showers 20,
            rain or snow 15. Thick cloud also caps the score — a solid low deck hides the mountain no matter how
            clear the air above it is.
          </p>
          <p>
            50 or more counts as “out” during daylight. Each neighborhood is then adjusted for its elevation,
            fog and buildings. It&apos;s a transparent weather formula, not a black box — and every reading is
            logged and checked against later conditions in the Mountain Log below.
          </p>
        </div>
      )}
    </motion.div>
  );
}
