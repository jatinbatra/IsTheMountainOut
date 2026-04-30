"use client";

import { useState } from "react";
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
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-[color:var(--type-1)]">Community</h2>
        <div
          className="inline-flex border border-[var(--rule)] p-0.5"
          role="tablist"
          aria-label="Community games"
        >
          {GAMES.map((g) => (
            <button
              key={g}
              role="tab"
              aria-selected={game === g}
              onClick={() => setGame(g)}
              className={`px-3 py-1.5 text-xs font-mono tracking-wide transition-all ${
                game === g
                  ? "bg-[color:var(--type-1)]/[0.08] text-[color:var(--type-1)]"
                  : "text-[color:var(--type-4)] hover:text-[color:var(--type-2)]"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
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
