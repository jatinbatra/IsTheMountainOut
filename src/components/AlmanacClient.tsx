"use client";

import { useState } from "react";
import {
  Mountain,
  CloudOff,
  TrendingUp,
  TrendingDown,
  Flame,
  Copy,
  Check,
  Calendar,
} from "lucide-react";
import type { AlmanacStats } from "@/lib/almanac";

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 ring-1 ring-white/[0.06] transition-colors"
      aria-label={copied ? "Copied" : label}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-300" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" aria-hidden="true" />
          {label}
        </>
      )}
    </button>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Mountain;
  tone?: "default" | "clear" | "gloom";
}) {
  const toneClass =
    tone === "clear"
      ? "from-emerald-500/[0.08] ring-emerald-400/25"
      : tone === "gloom"
        ? "from-slate-500/[0.08] ring-slate-400/20"
        : "from-white/[0.03] ring-white/[0.06]";
  const iconTone =
    tone === "clear"
      ? "text-emerald-300"
      : tone === "gloom"
        ? "text-slate-400"
        : "text-blue-300";
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${toneClass} via-white/[0.02] to-transparent ring-1 p-4 space-y-2`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconTone}`} aria-hidden="true" />
        <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">
          {label}
        </p>
      </div>
      <p className="font-display font-bold text-white text-2xl sm:text-3xl tabular-nums">
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default function AlmanacClient({ stats }: { stats: AlmanacStats }) {
  const { ytd, currentStreak, records, monthly, pressQuotes } = stats;
  const ytdPct = Math.round(ytd.clearRate * 100);

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentStreak && (
          <StatCard
            label="Current streak"
            value={`${currentStreak.days} day${currentStreak.days === 1 ? "" : "s"}`}
            sub={`${currentStreak.type === "out" ? "Mountain visible" : "Mountain hidden"} since ${currentStreak.since}`}
            icon={Flame}
            tone={currentStreak.type === "out" ? "clear" : "gloom"}
          />
        )}
        <StatCard
          label={`${ytd.year} clear days`}
          value={`${ytd.clearDays}`}
          sub={ytd.totalDays ? `${ytdPct}% of ${ytd.totalDays} tracked` : "no data yet"}
          icon={Mountain}
          tone="clear"
        />
        <StatCard
          label={`${ytd.year} gloom days`}
          value={`${ytd.gloomDays}`}
          sub={ytd.totalDays ? `${100 - ytdPct}% of ${ytd.totalDays} tracked` : "no data yet"}
          icon={CloudOff}
          tone="gloom"
        />
        <StatCard
          label={`${ytd.year} avg score`}
          value={`${ytd.avgScore}`}
          sub="0-100 visibility score"
          icon={TrendingUp}
        />
      </section>

      <section>
        <h2 className="font-display font-bold text-white text-sm mb-3">
          Records since {stats.sinceDate}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {records.longestClear ? (
            <div className="rounded-xl bg-emerald-500/[0.04] ring-1 ring-emerald-400/20 p-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-emerald-300/80">
                Longest clear streak
              </p>
              <p className="font-display font-bold text-white text-2xl tabular-nums mt-1">
                {records.longestClear.days} days
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {records.longestClear.start} → {records.longestClear.end}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-white/[0.02] ring-1 ring-white/[0.04] p-4 text-xs text-slate-500">
              Longest clear streak — not yet on record
            </div>
          )}
          {records.longestGloom ? (
            <div className="rounded-xl bg-slate-500/[0.05] ring-1 ring-slate-400/20 p-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">
                Longest gloom streak
              </p>
              <p className="font-display font-bold text-white text-2xl tabular-nums mt-1">
                {records.longestGloom.days} days
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {records.longestGloom.start} → {records.longestGloom.end}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-white/[0.02] ring-1 ring-white/[0.04] p-4 text-xs text-slate-500">
              Longest gloom streak — not yet on record
            </div>
          )}
          {records.bestSingleDay && (
            <div className="rounded-xl bg-white/[0.02] ring-1 ring-white/[0.04] p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">
                  Best day this year
                </p>
              </div>
              <p className="font-display font-bold text-white text-lg tabular-nums mt-1">
                {records.bestSingleDay.score} · {records.bestSingleDay.date}
              </p>
            </div>
          )}
          {records.worstSingleDay && (
            <div className="rounded-xl bg-white/[0.02] ring-1 ring-white/[0.04] p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">
                  Worst day this year
                </p>
              </div>
              <p className="font-display font-bold text-white text-lg tabular-nums mt-1">
                {records.worstSingleDay.score} · {records.worstSingleDay.date}
              </p>
            </div>
          )}
        </div>
      </section>

      {monthly.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-white text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-300" aria-hidden="true" />
            Monthly breakdown
          </h2>
          <div className="rounded-xl bg-white/[0.02] ring-1 ring-white/[0.04] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-slate-500 bg-white/[0.02]">
                  <th className="text-left px-3 py-2 font-semibold">Month</th>
                  <th className="text-right px-3 py-2 font-semibold">Clear</th>
                  <th className="text-right px-3 py-2 font-semibold">Tracked</th>
                  <th className="text-right px-3 py-2 font-semibold">Clear %</th>
                  <th className="text-right px-3 py-2 font-semibold">Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {monthly.map((m) => (
                  <tr key={m.month} className="text-slate-300">
                    <td className="px-3 py-2 font-semibold text-white">{m.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.clearDays}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                      {m.totalDays}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-300">
                      {Math.round(m.clearRate * 100)}%
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {m.avgScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {pressQuotes.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-white text-sm mb-3">
            Press-ready quotes
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Tap to copy. Use with attribution to IsTheMountainOut.com.
          </p>
          <div className="space-y-2">
            {pressQuotes.map((q, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/[0.02] ring-1 ring-white/[0.04] p-3 flex items-start gap-3"
              >
                <p className="flex-1 text-xs text-slate-200 leading-relaxed">
                  &ldquo;{q}&rdquo;
                </p>
                <CopyButton text={q} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
