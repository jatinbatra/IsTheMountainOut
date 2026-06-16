"use client";

import { useState } from "react";
import ForecastTimeline from "@/components/ForecastTimeline";
import { VISIBLE_THRESHOLD } from "@/lib/visibility";

const TABS = ["24h", "7-Day"] as const;
type Tab = (typeof TABS)[number];

interface HourData {
  time: string;
  score: number;
  isVisible: boolean;
  cloudLow: number;
  cloudMid: number;
  cloudHigh: number;
  temperature: number;
  humidity: number;
  visibility: number;
  weatherCode: number;
}

interface WeekDay {
  date: string;
  dayLabel: string;
  score: number;
  isVisible: boolean;
  weatherCode: number;
  tempHigh: number;
  tempLow: number;
}

interface Props {
  hourlyTimeline: HourData[];
  weeklyForecast?: WeekDay[];
}

export default function ForecastHub({ hourlyTimeline, weeklyForecast }: Props) {
  const [tab, setTab] = useState<Tab>("24h");

  return (
    <div className="space-y-1.5">
      <div className="inline-flex border-b border-[var(--rule)]" role="tablist" aria-label="Forecast view">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-medium transition-all border-b-2 -mb-px ${
              tab === t
                ? "border-[color:var(--accent)] text-[color:var(--type-1)]"
                : "border-transparent text-[color:var(--type-3)] hover:text-[color:var(--type-2)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={`${tab} forecast`}>
        {tab === "24h" && hourlyTimeline?.length > 0 && (
          <ForecastTimeline hourlyTimeline={hourlyTimeline} />
        )}
        {tab === "7-Day" && weeklyForecast && (
          <div className="space-y-1 py-2">
            {weeklyForecast.map((d) => (
              <div key={d.date} className="flex items-center justify-between text-[11px] py-1.5 border-b border-[var(--rule)]">
                <span className="font-medium text-[color:var(--type-2)] w-10">{d.dayLabel}</span>
                <div className="flex-1 mx-3 h-1.5 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.score}%`,
                      background: d.score >= 70 ? "var(--accent)" : d.score >= VISIBLE_THRESHOLD ? "var(--accent-gold)" : "var(--accent-pink)",
                    }}
                  />
                </div>
                <span className="tabular-nums text-[color:var(--type-3)] w-8 text-right">{d.score}</span>
                <span className="tabular-nums text-[color:var(--type-4)] w-16 text-right text-[10px]">
                  {Math.round(d.tempHigh)}° / {Math.round(d.tempLow)}°
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
