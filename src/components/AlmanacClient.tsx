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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide bg-[var(--ink-deep)] hover:bg-gray-200 text-[color:var(--type-3)] ring-1 ring-gray-200 transition-colors"
      aria-label={copied ? "Copied" : label}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-[#2d8a4e]" aria-hidden="true" />
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
      ? "bg-[#2d8a4e]/5 ring-[#2d8a4e]/20"
      : tone === "gloom"
        ? "bg-[var(--ink-deep)] ring-gray-200"
        : "bg-[var(--ink-deep)] ring-gray-200";
  const iconTone =
    tone === "clear"
      ? "text-[#2d8a4e]"
      : tone === "gloom"
        ? "text-[color:var(--type-4)]"
        : "text-blue-500";
  return (
    <div
      className={`rounded ${toneClass} ring-1 p-4 space-y-2`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconTone}`} aria-hidden="true" />
        <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--type-4)]">
          {label}
        </p>
      </div>
      <p className="font-display font-bold text-[color:var(--type-1)] text-2xl sm:text-3xl tabular-nums">
        {value}
      </p>
      {sub && <p className="text-xs text-[color:var(--type-3)]">{sub}</p>}
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
        <h2 className="font-display font-bold text-[color:var(--type-1)] text-sm mb-3">
          Records since {stats.sinceDate}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {records.longestClear ? (
            <div className="rounded bg-[#2d8a4e]/5 ring-1 ring-[#2d8a4e]/20 p-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[#2d8a4e]">
                Longest clear streak
              </p>
              <p className="font-display font-bold text-[color:var(--type-1)] text-2xl tabular-nums mt-1">
                {records.longestClear.days} days
              </p>
              <p className="text-xs text-[color:var(--type-3)] mt-1">
                {records.longestClear.start} → {records.longestClear.end}
              </p>
            </div>
          ) : (
            <div className="rounded bg-[var(--ink-deep)] ring-1 ring-gray-200 p-4 text-xs text-[color:var(--type-3)]">
              Longest clear streak: not yet on record
            </div>
          )}
          {records.longestGloom ? (
            <div className="rounded bg-[var(--ink-deep)] ring-1 ring-gray-200 p-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--type-4)]">
                Longest gloom streak
              </p>
              <p className="font-display font-bold text-[color:var(--type-1)] text-2xl tabular-nums mt-1">
                {records.longestGloom.days} days
              </p>
              <p className="text-xs text-[color:var(--type-3)] mt-1">
                {records.longestGloom.start} → {records.longestGloom.end}
              </p>
            </div>
          ) : (
            <div className="rounded bg-[var(--ink-deep)] ring-1 ring-gray-200 p-4 text-xs text-[color:var(--type-3)]">
              Longest gloom streak: not yet on record
            </div>
          )}
          {records.bestSingleDay && (
            <div className="rounded bg-[var(--ink-deep)] ring-1 ring-gray-200 p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#2d8a4e]" aria-hidden="true" />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--type-4)]">
                  Best day this year
                </p>
              </div>
              <p className="font-display font-bold text-[color:var(--type-1)] text-lg tabular-nums mt-1">
                {records.bestSingleDay.score} · {records.bestSingleDay.date}
              </p>
            </div>
          )}
          {records.worstSingleDay && (
            <div className="rounded bg-[var(--ink-deep)] ring-1 ring-gray-200 p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-[color:var(--type-4)]" aria-hidden="true" />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-[color:var(--type-4)]">
                  Worst day this year
                </p>
              </div>
              <p className="font-display font-bold text-[color:var(--type-1)] text-lg tabular-nums mt-1">
                {records.worstSingleDay.score} · {records.worstSingleDay.date}
              </p>
            </div>
          )}
        </div>
      </section>

      {monthly.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-[color:var(--type-1)] text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" aria-hidden="true" />
            Monthly breakdown
          </h2>
          <div className="rounded bg-[var(--ink-deep)] ring-1 ring-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-[color:var(--type-4)] bg-[var(--ink-deep)]">
                  <th className="text-left px-3 py-2 font-semibold">Month</th>
                  <th className="text-right px-3 py-2 font-semibold">Clear</th>
                  <th className="text-right px-3 py-2 font-semibold">Tracked</th>
                  <th className="text-right px-3 py-2 font-semibold">Clear %</th>
                  <th className="text-right px-3 py-2 font-semibold">Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthly.map((m) => (
                  <tr key={m.month} className="text-[color:var(--type-2)]">
                    <td className="px-3 py-2 font-semibold text-[color:var(--type-1)]">{m.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.clearDays}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[color:var(--type-4)]">
                      {m.totalDays}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-[#2d8a4e]">
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
          <h2 className="font-display font-bold text-[color:var(--type-1)] text-sm mb-3">
            Press-ready quotes
          </h2>
          <p className="text-xs text-[color:var(--type-3)] mb-3">
            Tap to copy. Use with attribution to IsTheMountainOut.com.
          </p>
          <div className="space-y-2">
            {pressQuotes.map((q, i) => (
              <div
                key={i}
                className="rounded bg-[var(--ink-deep)] ring-1 ring-gray-200 p-3 flex items-start gap-3"
              >
                <p className="flex-1 text-xs text-[color:var(--type-2)] leading-relaxed">
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
