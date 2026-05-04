"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Users } from "lucide-react";

interface Props {
  currentScore: number;
  isVisible: boolean;
}

interface VoteState {
  yesVotes: number;
  noVotes: number;
  userVote: "yes" | "no" | null;
  lastVoteTime: number;
}

const STORAGE_KEY = "mountain-community-vote";
const VOTE_COOLDOWN = 30 * 60 * 1000; // 30 minutes between votes

function getStoredVotes(): VoteState {
  if (typeof window === "undefined") return { yesVotes: 0, noVotes: 0, userVote: null, lastVoteTime: 0 };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Reset votes daily
      const now = Date.now();
      const storedDate = new Date(parsed.lastVoteTime).toDateString();
      const today = new Date(now).toDateString();
      if (storedDate !== today) {
        return { yesVotes: 0, noVotes: 0, userVote: null, lastVoteTime: 0 };
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return { yesVotes: 0, noVotes: 0, userVote: null, lastVoteTime: 0 };
}

function generateMockCommunityVotes(isVisible: boolean): { yes: number; no: number } {
  const base = isVisible ? 35 : 8;
  const yes = base + Math.floor(Math.random() * 15);
  const noBase = isVisible ? 3 : 20;
  const no = noBase + Math.floor(Math.random() * 10);
  return { yes, no };
}

export default function CommunityVote({ currentScore, isVisible }: Props) {
  const [votes, setVotes] = useState<VoteState>({ yesVotes: 0, noVotes: 0, userVote: null, lastVoteTime: 0 });
  const [canVote, setCanVote] = useState(true);
  const [justVoted, setJustVoted] = useState(false);

  useEffect(() => {
    const stored = getStoredVotes();
    const mock = generateMockCommunityVotes(isVisible);
    setVotes({
      ...stored,
      yesVotes: stored.yesVotes + mock.yes,
      noVotes: stored.noVotes + mock.no,
    });
    setCanVote(!stored.userVote || Date.now() - stored.lastVoteTime > VOTE_COOLDOWN);
  }, [isVisible]);

  const handleVote = (vote: "yes" | "no") => {
    if (!canVote) return;

    const newVotes: VoteState = {
      yesVotes: votes.yesVotes + (vote === "yes" ? 1 : 0),
      noVotes: votes.noVotes + (vote === "no" ? 1 : 0),
      userVote: vote,
      lastVoteTime: Date.now(),
    };

    setVotes(newVotes);
    setCanVote(false);
    setJustVoted(true);
    setTimeout(() => setJustVoted(false), 2000);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        yesVotes: newVotes.yesVotes - (generateMockCommunityVotes(isVisible).yes),
        noVotes: newVotes.noVotes - (generateMockCommunityVotes(isVisible).no),
        userVote: vote,
        lastVoteTime: newVotes.lastVoteTime,
      }));
    } catch { /* ignore */ }
  };

  const totalVotes = votes.yesVotes + votes.noVotes;
  const yesPercent = totalVotes > 0 ? Math.round((votes.yesVotes / totalVotes) * 100) : 50;

  return (
    <div className="alpine-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-50">
            <Users className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--type-1)]">Community Check</h3>
            <p className="text-[10px] text-[color:var(--type-4)]">Can you see the mountain right now?</p>
          </div>
        </div>
        <span className="text-[10px] text-[color:var(--type-4)] font-medium">
          {totalVotes} reports today
        </span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleVote("yes")}
          disabled={!canVote}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all ${
            votes.userVote === "yes"
              ? "bg-[#2d8a4e]/10 text-[#2d8a4e] ring-2 ring-[#2d8a4e]/30"
              : canVote
                ? "bg-gray-50 hover:bg-[#2d8a4e]/5 text-[color:var(--type-3)] hover:text-[#2d8a4e]"
                : "bg-gray-50 text-[color:var(--type-4)] cursor-not-allowed"
          }`}
        >
          <Eye className="w-4 h-4" />
          I see it!
        </button>
        <button
          onClick={() => handleVote("no")}
          disabled={!canVote}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all ${
            votes.userVote === "no"
              ? "bg-red-50 text-red-500 ring-2 ring-red-300/30"
              : canVote
                ? "bg-gray-50 hover:bg-red-50 text-[color:var(--type-3)] hover:text-red-500"
                : "bg-gray-50 text-[color:var(--type-4)] cursor-not-allowed"
          }`}
        >
          <EyeOff className="w-4 h-4" />
          Nope, hidden
        </button>
      </div>

      {justVoted && (
        <p className="text-xs text-center text-[#2d8a4e] animate-fade-up">
          Thanks for reporting! Your vote helps the community.
        </p>
      )}

      <div className="space-y-2">
        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden flex">
          <div
            className="h-full bg-[#2d8a4e]/60 transition-all duration-500"
            style={{ width: `${yesPercent}%` }}
          />
          <div
            className="h-full bg-red-400/40 transition-all duration-500"
            style={{ width: `${100 - yesPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[color:var(--type-4)]">
          <span>{yesPercent}% say visible ({votes.yesVotes})</span>
          <span>{100 - yesPercent}% say hidden ({votes.noVotes})</span>
        </div>
      </div>

      {!canVote && !justVoted && (
        <p className="text-[10px] text-center text-[color:var(--type-4)]">
          You can vote again in 30 minutes
        </p>
      )}
    </div>
  );
}
