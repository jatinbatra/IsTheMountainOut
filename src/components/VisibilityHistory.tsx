"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  isVisible: boolean;
}

// Mock 7-day history data — replace with real API data when available
const MOCK_HISTORY = [
  { day: "Mon", score: 82, visible: true },
  { day: "Tue", score: 34, visible: false },
  { day: "Wed", score: 15, visible: false },
  { day: "Thu", score: 68, visible: true },
  { day: "Fri", score: 91, visible: true },
  { day: "Sat", score: 45, visible: false },
  { day: "Sun", score: 73, visible: true },
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof MOCK_HISTORY[0] }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-white">{d.day}</p>
      <p className="text-[11px] text-white/50">
        Score: <span className="text-white/80 font-medium">{d.score}/100</span>
      </p>
      <p className={`text-[10px] font-medium ${d.visible ? "text-emerald-400" : "text-red-400"}`}>
        {d.visible ? "Visible" : "Hidden"}
      </p>
    </div>
  );
}

export default function VisibilityHistory({ isVisible }: Props) {
  return (
    <div className="glass rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-white">
          7-Day Visibility History
        </h3>
        <span className="text-[10px] text-white/20 font-medium uppercase tracking-wider">
          Mock Data
        </span>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={MOCK_HISTORY} barCategoryGap="20%">
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
              width={30}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)", radius: 8 }}
            />
            <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {MOCK_HISTORY.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.visible
                      ? isVisible
                        ? "rgba(52, 211, 153, 0.6)"
                        : "rgba(52, 211, 153, 0.3)"
                      : "rgba(239, 68, 68, 0.35)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-white/25">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400/60" />
          <span>Visible (50+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-400/35" />
          <span>Hidden (&lt;50)</span>
        </div>
      </div>
    </div>
  );
}
