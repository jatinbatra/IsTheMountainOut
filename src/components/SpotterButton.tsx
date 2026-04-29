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
    <div className="flex items-center justify-between py-4 border-b border-white/[0.06]">
      <div className="flex items-center gap-3 min-w-0">
        {confirmed ? (
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
        ) : (
          <Eye className="w-4 h-4 text-white/30 flex-shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {count > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-white/40" aria-hidden="true" />
                {count.toLocaleString()} {count === 1 ? "person sees" : "people see"} Rainier now
              </span>
            ) : confirmed ? (
              "First spotter this hour"
            ) : (
              "Can you see the mountain right now?"
            )}
          </p>
        </div>
      </div>
      <button
        onClick={submit}
        disabled={confirmed || submitting}
        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
          confirmed
            ? "text-emerald-400/60 bg-emerald-500/10"
            : "text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08]"
        } disabled:cursor-default`}
        aria-label={confirmed ? "You already confirmed" : "I see the mountain"}
      >
        {confirmed ? "Spotted" : "I see it"}
      </button>
    </div>
  );
}
