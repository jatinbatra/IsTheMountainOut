"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { Eye, Check, Users } from "lucide-react";
import { getUserId } from "@/lib/identity";

interface SpotterResponse {
  count: number;
  mine: boolean;
}

interface Props {
  isVisible: boolean;
  score: number;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const LOCAL_KEY = (hour: string) => `spotter:${hour}`;

function currentHourKey(): string {
  const d = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    timeZone: "America/Los_Angeles",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}-${get("hour")}`;
}

export default function SpotterButton({ isVisible, score }: Props) {
  const [userId, setUid] = useState("ssr");
  const [locallyConfirmed, setLocallyConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUid(getUserId());
    try {
      const key = LOCAL_KEY(currentHourKey());
      if (window.localStorage.getItem(key)) setLocallyConfirmed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const key =
    userId !== "ssr" ? `/api/spotters?userId=${encodeURIComponent(userId)}` : null;
  const { data, mutate } = useSWR<SpotterResponse>(key, fetcher, {
    refreshInterval: 60 * 1000,
  });

  const confirmed = data?.mine === true || locallyConfirmed;

  const submit = useCallback(async () => {
    if (!userId || userId === "ssr" || submitting) return;
    setSubmitting(true);
    try {
      window.localStorage.setItem(LOCAL_KEY(currentHourKey()), "1");
    } catch {
      /* ignore */
    }
    setLocallyConfirmed(true);
    try {
      await fetch("/api/spotters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      mutate();
    } finally {
      setSubmitting(false);
    }
  }, [userId, mutate, submitting]);

  if (!isVisible || score < 55) return null;

  const count = Math.max(data?.count ?? 0, confirmed ? 1 : 0);

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 ring-1 transition-all ${
        confirmed
          ? "bg-gradient-to-br from-emerald-500/[0.08] to-blue-500/[0.06] ring-emerald-400/25"
          : "bg-gradient-to-br from-emerald-500/[0.06] via-white/[0.02] to-blue-500/[0.04] ring-emerald-400/15"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex-shrink-0 p-2.5 rounded-xl ring-1 ${
            confirmed
              ? "bg-emerald-500/20 ring-emerald-400/30"
              : "bg-emerald-500/10 ring-emerald-400/20"
          }`}
        >
          {confirmed ? (
            <Check className="w-4 h-4 text-emerald-300" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4 text-emerald-300" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-emerald-300/80">
            {confirmed ? "You spotted it" : "Can you see it right now?"}
          </p>
          <p className="text-sm font-display font-bold text-white mt-0.5 truncate">
            {count > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-white/60" aria-hidden="true" />
                {count.toLocaleString()} {count === 1 ? "person sees" : "people see"} Rainier now
              </span>
            ) : confirmed ? (
              "First one in the last hour."
            ) : (
              "Tap to confirm a live sighting."
            )}
          </p>
        </div>
        <button
          onClick={submit}
          disabled={confirmed || submitting}
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-display font-bold transition-all disabled:cursor-default ${
            confirmed
              ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
              : "bg-gradient-to-br from-emerald-400/30 to-blue-400/25 text-white ring-1 ring-emerald-400/45 shadow-lg shadow-emerald-500/10 hover:ring-emerald-300/60"
          }`}
          aria-label={confirmed ? "You already confirmed" : "I see the mountain"}
        >
          {confirmed ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Seen
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              I see it
            </>
          )}
        </button>
      </div>
    </div>
  );
}
