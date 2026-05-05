"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Dice5, Loader2, Check, Trophy, Sparkles, AlertCircle } from "lucide-react";
import { getUserId, getHandle, setHandle } from "@/lib/identity";
import { getLocalGuess, setLocalGuess } from "@/lib/localPersist";

interface DayGuess {
  date: string;
  revealHour: number;
  isRevealed: boolean;
  actualPeak: number | null;
  myGuess: { userId: string; handle: string; guess: number; submittedAt: string } | null;
  myError: number | null;
  totalPlays: number;
  averageGuess: number | null;
  top: { handle: string; error: number; guess: number }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function tierLabel(error: number): string {
  if (error <= 3) return "Nailed it";
  if (error <= 8) return "Sharp";
  if (error <= 15) return "Close";
  return "Off";
}

function tierColor(error: number): string {
  if (error <= 3) return "text-[#2d8a4e]";
  if (error <= 8) return "text-blue-600";
  if (error <= 15) return "text-amber-600";
  return "text-rose-500";
}

export default function GuessTheScore() {
  const [userId, setUid] = useState("ssr");
  const [handleInput, setHandleInput] = useState("");
  const [guess, setGuess] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localGuess, setLocalGuessState] = useState<{ guess: number; date: string } | null>(null);

  useEffect(() => {
    setUid(getUserId());
    setHandleInput(getHandle());
  }, []);

  const key = userId !== "ssr" ? `/api/guess?userId=${encodeURIComponent(userId)}` : null;
  const { data, mutate, isLoading } = useSWR<DayGuess>(key, fetcher, {
    refreshInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data?.myGuess) {
      setGuess(data.myGuess.guess);
      return;
    }
    if (data?.date) {
      const local = getLocalGuess(data.date);
      if (local) {
        setGuess(local.guess);
        setLocalGuessState({ guess: local.guess, date: data.date });
      }
    }
  }, [data?.myGuess, data?.date]);

  const submitted = !!data?.myGuess || !!localGuess;
  const revealed = data?.isRevealed ?? false;
  const onlyLocal = !data?.myGuess && !!localGuess;

  const submit = useCallback(async () => {
    if (!userId || userId === "ssr") return;
    setSubmitting(true);
    setError(null);
    try {
      if (handleInput) setHandle(handleInput);
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, handle: handleInput || "anon", guess }),
      });
      if (data?.date) setLocalGuess(data.date, guess);
      setLocalGuessState(data?.date ? { guess, date: data.date } : null);

      if (res.ok) {
        mutate();
      } else {
        const body = await res.json().catch(() => ({}));
        const code = typeof body?.error === "string" ? body.error : null;
        if (code === "already_revealed") {
          setError("Today’s answer is already out — come back tomorrow.");
        }
      }
    } catch {
      if (data?.date) setLocalGuess(data.date, guess);
      setLocalGuessState(data?.date ? { guess, date: data.date } : null);
    } finally {
      setSubmitting(false);
    }
  }, [userId, handleInput, guess, mutate, data?.date]);

  const heading = useMemo(() => {
    if (revealed) return "Today's reveal";
    if (submitted) return "Your guess is in";
    return "Guess today's peak score";
  }, [revealed, submitted]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <Dice5 className="w-4 h-4 text-violet-500" aria-hidden="true" />
          <div>
            <h2 className="font-display text-base font-bold text-[color:var(--type-1)]">Guess the Score</h2>
            <p className="text-[11px] text-[color:var(--type-3)] font-medium tracking-wide mt-0.5">
              {heading} · reveals nightly at 8pm PT
            </p>
          </div>
        </div>
        {data && data.totalPlays > 0 && (
          <div className="text-right">
            <div className="font-display text-sm font-bold text-[color:var(--type-1)] tabular-nums leading-none">
              {data.totalPlays}
            </div>
            <div className="text-[9px] uppercase tracking-wide text-[color:var(--type-4)] font-semibold">
              {data.totalPlays === 1 ? "player" : "players"}
            </div>
          </div>
        )}
      </div>

      {revealed ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wide text-[color:var(--type-4)] font-semibold">Actual peak</div>
              <div className="font-display text-4xl font-black text-[color:var(--type-1)] tabular-nums mt-1">
                {data?.actualPeak ?? "-"}
              </div>
            </div>
            {data?.myGuess && (
              <>
                <div className="h-12 w-px bg-gray-200" aria-hidden="true" />
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wide text-[color:var(--type-4)] font-semibold">
                    Your guess
                  </div>
                  <div className="font-display text-4xl font-black text-[color:var(--type-1)] tabular-nums mt-1">
                    {data.myGuess.guess}
                  </div>
                  {data.myError !== null && (
                    <div className={`text-[11px] font-bold mt-1 ${tierColor(data.myError)}`}>
                      {tierLabel(data.myError)} · off by {data.myError}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {data && data.top.length > 0 && (
            <div className="border border-[var(--rule)] overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--rule)]">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-display font-bold text-[color:var(--type-1)]">Top guesses</span>
              </div>
              <ul className="divide-y divide-[var(--rule)]">
                {data.top.map((t, i) => (
                  <li key={`${t.handle}-${i}`} className="flex items-center gap-3 px-3 py-1.5">
                    <span className={`font-mono text-[10px] font-bold w-5 ${i === 0 ? "text-amber-500" : "text-[color:var(--type-4)]"}`}>
                      #{i + 1}
                    </span>
                    <span className="flex-1 text-sm text-[color:var(--type-2)] truncate">{t.handle}</span>
                    <span className="text-[11px] text-[color:var(--type-4)] tabular-nums">guess {t.guess}</span>
                    <span className="text-[11px] text-[color:var(--type-3)] tabular-nums">&plusmn;{t.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!data?.myGuess && (
            <p className="text-xs text-[color:var(--type-4)] text-center">
              You missed today&apos;s round. The next one opens at midnight PT.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-end justify-center gap-3">
            <span className="font-display text-6xl font-black text-[color:var(--type-1)] tabular-nums leading-none">
              {guess}
            </span>
            <span className="text-[color:var(--type-4)] text-lg font-light pb-2">/100</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={guess}
            onChange={(e) => {
              setGuess(Number(e.target.value));
              setError(null);
            }}
            className="w-full accent-violet-500 cursor-pointer"
            aria-label="Your guess"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="handle (optional)"
              value={handleInput}
              onChange={(e) => setHandleInput(e.target.value.slice(0, 24))}
              className="flex-1 min-w-0 px-3 py-2 bg-transparent border border-[var(--rule)] text-xs text-[color:var(--type-1)] placeholder:text-[color:var(--type-4)] focus:outline-none focus:border-[color:var(--accent)]"
              maxLength={24}
            />
            <button
              onClick={submit}
              disabled={submitting || isLoading}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-display font-bold transition-all disabled:opacity-50 ${
                error
                  ? "text-red-600 border border-red-200"
                  : submitted
                    ? "bg-[#2d8a4e]/10 text-[#2d8a4e] border border-[#2d8a4e]/20"
                    : "bg-[color:var(--accent)] text-white hover:opacity-90"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Locking…
                </>
              ) : error ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  Retry
                </>
              ) : submitted ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Update guess
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Lock guess
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
              <AlertCircle className="w-3 h-3" aria-hidden="true" />
              {error}
            </p>
          )}
          {onlyLocal && !error && (
            <p className="text-[11px] text-orange-600 font-medium">
              Saved on this device. Leaderboard is offline right now.
            </p>
          )}
          {data && data.averageGuess !== null && !submitted && (
            <p className="text-[11px] text-[color:var(--type-4)] text-center">
              {data.totalPlays} others guessed, average {data.averageGuess}/100.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
