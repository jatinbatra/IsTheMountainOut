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
    <div className="flex items-center justify-between py-2 border-b border-gray-200">
      <div className="flex items-center gap-3 min-w-0">
        {confirmed ? (
          <Check className="w-4 h-4 text-[#2d8a4e] flex-shrink-0" aria-hidden="true" />
        ) : (
          <Eye className="w-4 h-4 text-[color:var(--type-4)] flex-shrink-0" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-[color:var(--type-1)] truncate">
            {count > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[color:var(--type-3)]" aria-hidden="true" />
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
            ? "text-[#2d8a4e] bg-[#2d8a4e]/10"
            : "text-[color:var(--type-1)] bg-[var(--ink-deep)] hover:bg-[var(--ink-deep)] border border-gray-200"
        } disabled:cursor-default`}
        aria-label={confirmed ? "You already confirmed" : "I see the mountain"}
      >
        {confirmed ? "Spotted" : "I see it"}
      </button>
    </div>
  );
}
