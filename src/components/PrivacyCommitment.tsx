"use client";

import { Shield } from "lucide-react";

const CHIPS = [
  "No ads",
  "No cookies",
  "No tracking",
  "No accounts",
  "No data storage",
];

export default function PrivacyCommitment() {
  return (
    <div
      className="rounded-2xl ring-1 ring-emerald-400/15 bg-gradient-to-br from-emerald-500/[0.06] via-white/[0.02] to-blue-500/[0.04] px-4 py-3.5"
      role="note"
      aria-label="Privacy commitment"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/20">
          <Shield className="w-4 h-4 text-emerald-300" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-emerald-300/80">
            Private by design
          </p>
          <p className="text-sm text-white/75 font-medium mt-1 leading-snug">
            Just a weather app. Nothing about you leaves this page.
          </p>
          <ul className="flex flex-wrap gap-1.5 mt-2.5" aria-label="What we don't do">
            {CHIPS.map((chip) => (
              <li
                key={chip}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.04] ring-1 ring-white/[0.08] text-[10px] font-semibold tracking-wide text-white/70"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
