"use client";

import useSWR from "swr";
import type { HistoryResponse } from "@/app/api/history/route";

type State = "out" | "hidden" | "night";

const TZ = "America/Los_Angeles";
const SLOT_MS = 15 * 60 * 1000;
const SLOTS_24H = 96;

const STATE_COLOR: Record<State, string> = {
  out: "var(--accent)",
  hidden: "var(--accent-pink)",
  night: "rgba(148, 135, 117, 0.35)",
};
const EMPTY_COLOR = "rgba(58, 48, 38, 0.6)";

const STATE_LABEL: Record<State, string> = {
  out: "Out",
  hidden: "Hidden",
  night: "Night",
};

const EVENT_LABEL: Record<State, string> = {
  out: "Mountain came out",
  hidden: "Hid behind clouds",
  night: "Night fell",
};

async function fetcher(url: string): Promise<HistoryResponse> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`history ${r.status}`);
  return r.json();
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
}

function fmtDayTime(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-CA", { timeZone: TZ });
  const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString("en-CA", { timeZone: TZ });
  const prefix =
    day === today
      ? "Today"
      : day === yesterday
        ? "Yesterday"
        : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ });
  return `${prefix} · ${fmtTime(iso)}`;
}

function fmtAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)} days ago`;
}

function fmtDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-primary)" }}>
      <p className="text-[9px] uppercase tracking-[0.12em] font-semibold" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </p>
      <p className="font-display mt-1 leading-none" style={{ fontSize: "1.5rem", color: "var(--text-hero)" }}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
      {(["out", "hidden", "night"] as State[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: STATE_COLOR[s] }} />
          {STATE_LABEL[s]}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: EMPTY_COLOR }} />
        No reading
      </span>
    </div>
  );
}

export default function HistoryCard() {
  const { data, error, isLoading } = useSWR<HistoryResponse>("/api/history", fetcher, {
    refreshInterval: 5 * 60 * 1000,
    revalidateOnFocus: true,
  });

  return (
    <section id="section-history" className="dash-card mt-4" aria-labelledby="history-heading">
      <div className="dash-card-header flex items-center justify-between gap-3">
        <h2 id="history-heading" className="text-[10px] font-normal">Mountain Log</h2>
        {data?.current && (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
            style={{ border: `1px solid ${STATE_COLOR[data.current.state]}`, color: STATE_COLOR[data.current.state] }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATE_COLOR[data.current.state] }} />
            {STATE_LABEL[data.current.state]} · logged {fmtAgo(data.current.ts)}
          </span>
        )}
      </div>

      {isLoading && !data && <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Loading history…</p>}

      {(error || data?.storage === "error") && (
        <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
          Couldn&apos;t load the mountain log right now. It will retry automatically.
        </p>
      )}

      {data?.storage === "unconfigured" && (
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          History storage isn&apos;t connected yet, so readings aren&apos;t being saved. Once a Redis/KV store is
          connected, every reading is logged automatically at 15-minute resolution and this section fills in.
        </p>
      )}

      {data?.storage === "ok" && <HistoryBody data={data} />}
    </section>
  );
}

function HistoryBody({ data }: { data: HistoryResponse }) {
  const { stats, analytics, events, days, last24h } = data;
  const hasAnyData = stats.daysTracked > 0 || last24h.length > 0;

  // Place each reading in its 15-minute cell across the last 24 hours.
  // Anchor to the server's response time so rendering stays pure.
  const now = new Date(data.generatedAt).getTime();
  const start = now - SLOTS_24H * SLOT_MS;
  const cells: ({ state: State; score: number; ts: string } | null)[] = Array(SLOTS_24H).fill(null);
  for (const o of last24h) {
    const idx = Math.floor((new Date(o.ts).getTime() - start) / SLOT_MS);
    if (idx >= 0 && idx < SLOTS_24H) cells[idx] = { state: o.state, score: o.score, ts: o.ts };
  }

  const streakText = stats.streak
    ? `${stats.streak.days} day${stats.streak.days === 1 ? "" : "s"}`
    : "—";
  const streakSub = stats.streak ? (stats.streak.type === "out" ? "in a row out" : "in a row hidden") : "needs a full day";
  const maxViews = Math.max(1, ...analytics.views7d.map((v) => v.views));

  return (
    <div className="space-y-6">
      {!hasAnyData && (
        <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
          Logging is live — the first readings appear here within 15 minutes and build up into a full history.
        </p>
      )}

      {/* Signals & metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Stat label="Out days (30d)" value={`${stats.outDays30}`} sub={`of ${stats.observedDays30} days logged`} />
        <Stat label="Clear rate" value={stats.clearRate30 == null ? "—" : `${stats.clearRate30}%`} sub="last 30 days" />
        <Stat label="Streak" value={streakText} sub={streakSub} />
        <Stat label="Out today" value={stats.outHoursToday < 1 ? `${Math.round(stats.outHoursToday * 60)}m` : `${stats.outHoursToday}h`} sub="daylight hours visible" />
        <Stat label="Last seen out" value={stats.lastSeenOut ? fmtAgo(stats.lastSeenOut) : "—"} sub={stats.lastSeenOut ? fmtDayTime(stats.lastSeenOut) : "no sighting logged yet"} />
        <Stat label="Avg peak score" value={stats.avgPeak30 == null ? "—" : `${stats.avgPeak30}`} sub="best reading per day" />
        <Stat label="Spotting now" value={`${analytics.spottersNow}`} sub="people this hour" />
        <Stat label="Visitors today" value={`${analytics.viewsToday}`} sub={stats.trackingSince ? `tracking since ${fmtDate(stats.trackingSince)}` : "page views"} />
      </div>

      {/* Last 24 hours */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>Last 24 hours</h3>
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>15-minute readings</span>
        </div>
        <div className="flex gap-[2px] h-9 items-stretch" role="img" aria-label="Mountain visibility over the last 24 hours">
          {cells.map((c, i) => (
            <div
              key={i}
              className="flex-1 rounded-[2px]"
              style={{ background: c ? STATE_COLOR[c.state] : EMPTY_COLOR, opacity: c?.state === "out" ? 0.55 + (c.score / 100) * 0.45 : 1 }}
              title={c ? `${fmtTime(c.ts)} — ${STATE_LABEL[c.state]} (score ${c.score})` : "No reading"}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5 text-[9px]" style={{ color: "var(--text-tertiary)" }}>
          <span>{fmtTime(new Date(start).toISOString())}</span>
          <span>{fmtTime(new Date(start + 12 * 3600_000).toISOString())}</span>
          <span>Now</span>
        </div>
      </div>

      {/* Last 30 days */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>Last 30 days</h3>
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>was it out at any point in daylight?</span>
        </div>
        <div className="grid gap-1.5 max-w-xl" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
          {days.map((d) => (
            <div
              key={d.date}
              className="aspect-square rounded-[4px]"
              style={{ background: !d.observed ? EMPTY_COLOR : d.isVisible ? STATE_COLOR.out : STATE_COLOR.hidden, opacity: d.observed && !d.isVisible ? 0.6 : 1 }}
              title={
                d.observed
                  ? `${fmtDate(d.date)} — ${d.isVisible ? `Out ~${d.outHours}h` : "Hidden all day"} · peak ${d.score}`
                  : `${fmtDate(d.date)} — no readings`
              }
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5 text-[9px] max-w-xl" style={{ color: "var(--text-tertiary)" }}>
          <span>{days[0] && fmtDate(days[0].date)}</span>
          <span>Today</span>
        </div>
      </div>

      <Legend />

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Change log */}
        <div>
          <h3 className="text-[11px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Recent changes</h3>
          {events.length === 0 ? (
            <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>No changes logged yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {events.map((e) => (
                <li key={e.ts} className="flex items-center gap-2.5 text-[11px]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATE_COLOR[e.state] }} />
                  <span style={{ color: "var(--text-primary)" }}>{EVENT_LABEL[e.state]}</span>
                  <span className="ml-auto tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                    {fmtDayTime(e.ts)} · {e.score}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Visitors */}
        <div>
          <h3 className="text-[11px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Visitors, last 7 days</h3>
          <div className="flex items-end gap-2 h-20">
            {analytics.views7d.map((v) => (
              <div key={v.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${fmtDate(v.date)}: ${v.views} views`}>
                <span className="text-[9px] tabular-nums" style={{ color: "var(--text-tertiary)" }}>{v.views}</span>
                <div className="w-full rounded-t-[3px]" style={{ height: `${Math.max(4, (v.views / maxViews) * 100)}%`, background: "var(--accent-gold)", opacity: 0.75 }} />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-1">
            {analytics.views7d.map((v) => (
              <span key={v.date} className="flex-1 text-center text-[9px]" style={{ color: "var(--text-tertiary)" }}>
                {fmtDate(v.date).split(",")[0]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
