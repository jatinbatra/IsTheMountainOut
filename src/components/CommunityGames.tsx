"use client";

import { useState } from "react";
import { Gamepad2 } from "lucide-react";
import HoodWars from "@/components/HoodWars";
import GuessTheScore from "@/components/GuessTheScore";
import MountainPool from "@/components/MountainPool";

const GAMES = ["Hood Wars", "Guess Score", "Pool"] as const;
type Game = (typeof GAMES)[number];

interface Props {
  selectedHood: string | null;
  onSelectHood: (id: string | null) => void;
  fallbackScores: { id: string; score: number }[];
  fallbackLabels: Record<string, string>;
}

export default function CommunityGames({
  selectedHood,
  onSelectHood,
  fallbackScores,
  fallbackLabels,
}: Props) {
  const [game, setGame] = useState<Game>("Hood Wars");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-500/10 ring-1 ring-violet-400/15">
          <Gamepad2 className="w-4 h-4 text-violet-400" aria-hidden="true" />
        </div>
        <h2 className="font-display text-lg font-bold text-white">Community</h2>
      </div>

      <div
        className="inline-flex rounded-lg bg-white/[0.04] ring-1 ring-white/[0.06] p-0.5"
        role="tablist"
        aria-label="Community games"
      >
        {GAMES.map((g) => (
          <button
            key={g}
            role="tab"
            aria-selected={game === g}
            onClick={() => setGame(g)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              game === g
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={game}>
        {game === "Hood Wars" && (
          <HoodWars
            selected={selectedHood}
            onSelect={onSelectHood}
            fallbackScores={fallbackScores}
            fallbackLabels={fallbackLabels}
          />
        )}
        {game === "Guess Score" && <GuessTheScore />}
        {game === "Pool" && <MountainPool />}
      </div>
    </div>
  );
}
