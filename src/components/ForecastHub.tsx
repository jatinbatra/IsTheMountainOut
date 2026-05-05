"use client";

import { useState } from "react";
import ForecastTimeline from "@/components/ForecastTimeline";
import VisibilityHistory from "@/components/VisibilityHistory";
import MountainCalendar from "@/components/MountainCalendar";
import WeekendAtRainier from "@/components/WeekendAtRainier";
import OutdoorWidget from "@/components/OutdoorWidget";
import type { WeeklyForecastDay } from "@/components/Dashboard";

const TABS = ["24h", "7-Day", "Calendar"] as const;
type Tab = (typeof TABS)[number];

interface Props {
  hourlyTimeline: { time: string; score: number; isVisible: boolean; cloudLow: number; cloudMid: number; cloudHigh: number; temperature: number; humidity: number; visibility: number; weatherCode: number }[];
  currentScore: number;
  isVisible: boolean;
  weeklyForecast?: WeeklyForecastDay[];
  sunset?: string;
}

export default function ForecastHub({
  hourlyTimeline,
  currentScore,
  isVisible,
  weeklyForecast,
  sunset,
}: Props) {
  const [tab, setTab] = useState<Tab>("24h");

  return (
    <div className="space-y-4">
      <div
        className="inline-flex rounded bg-[var(--ink-deep)] p-1"
        role="tablist"
        aria-label="Forecast view"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              tab === t
                ? "bg-[var(--ink-deep)] text-[color:var(--type-1)]"
                : "text-[color:var(--type-3)] hover:text-[color:var(--type-2)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={`${tab} forecast`}>
        {tab === "24h" && hourlyTimeline?.length > 0 && (
          <ForecastTimeline
            hourlyTimeline={hourlyTimeline}
            currentScore={currentScore}
          />
        )}
        {tab === "7-Day" && (
          <VisibilityHistory
            isVisible={isVisible}
            weeklyForecast={weeklyForecast}
          />
        )}
        {tab === "Calendar" && <MountainCalendar />}
      </div>

      <div className="space-y-4 pt-2">
        <WeekendAtRainier weeklyForecast={weeklyForecast} />
        <OutdoorWidget isVisible={isVisible} sunset={sunset} />
      </div>
    </div>
  );
}
