import { VISIBLE_THRESHOLD } from "@/lib/visibility";
import { getDayObservations, ptDay, ptParts, shiftDay, type Observation } from "@/lib/history";

// ── Validation ───────────────────────────────────────────────────────
// 1. Forecast accuracy: each reading stores the score it forecast for +1h,
//    +3h and +6h. When that hour arrives and is itself logged, we compare.
// 2. Community check: readings where people tapped "I see it" — did the
//    model also say the mountain was out?
// 3. Data quality: share of readings whose inputs failed a QA check.
// 4. Coverage: how many of the expected 15-minute slots were logged.

export type Reading = Observation & { slot: string; day: string };

export interface HorizonStats {
  horizon: "1h" | "3h" | "6h";
  samples: number;
  /** Mean absolute error, in score points (0-100 scale). */
  mae: number | null;
  /** Mean signed error (forecast − actual): + means the model was too optimistic. */
  bias: number | null;
  /** Daylight samples where forecast and actual agreed on out vs hidden. */
  stateSamples: number;
  stateAccuracy: number | null;
}

export interface ValidationReport {
  days: number;
  forecast: HorizonStats[];
  community: { readingsWithSightings: number; modelSaidOut: number; agreement: number | null };
  quality: {
    readingsWithTelemetry: number;
    readingsWithIssues: number;
    passRate: number | null;
    issueCounts: Record<string, number>;
    latestIssue: { ts: string; issues: string[] } | null;
  };
  coverage: { logged: number; expected: number; rate: number | null };
}

export async function loadReadings(days: number, endDay = ptDay()): Promise<Reading[]> {
  const dayList = Array.from({ length: days }, (_, i) => shiftDay(endDay, i - (days - 1)));
  const perDay = await Promise.all(dayList.map((d) => getDayObservations(d).catch(() => [])));
  return perDay.flatMap((obs, i) => obs.map((o) => ({ ...o, day: dayList[i] })));
}

const hourKey = (ts: string | Date) => {
  const { day, slot } = ptParts(typeof ts === "string" ? new Date(ts) : ts);
  return `${day}T${slot.slice(0, 2)}`;
};
const round1 = (n: number) => Math.round(n * 10) / 10;

export function buildValidation(readings: Reading[], days: number, now = new Date()): ValidationReport {
  // Actual conditions per Seattle hour: mean score, and the daylight state.
  const actual = new Map<string, { scores: number[]; daylight: boolean }>();
  for (const r of readings) {
    const key = hourKey(r.ts);
    const a = actual.get(key) ?? { scores: [], daylight: false };
    a.scores.push(r.score);
    if (r.state !== "night") a.daylight = true;
    actual.set(key, a);
  }

  const horizons: { h: HorizonStats["horizon"]; field: "h1" | "h3" | "h6"; hours: number }[] = [
    { h: "1h", field: "h1", hours: 1 },
    { h: "3h", field: "h3", hours: 3 },
    { h: "6h", field: "h6", hours: 6 },
  ];
  const forecast: HorizonStats[] = horizons.map(({ h, field, hours }) => {
    const errors: number[] = [];
    let stateSamples = 0;
    let stateHits = 0;
    for (const r of readings) {
      const predicted = r.signals?.forecast?.[field];
      if (predicted == null) continue;
      const target = actual.get(hourKey(new Date(new Date(r.ts).getTime() + hours * 3_600_000)));
      if (!target) continue;
      const mean = target.scores.reduce((s, x) => s + x, 0) / target.scores.length;
      errors.push(predicted - mean);
      if (target.daylight) {
        stateSamples++;
        if ((predicted >= VISIBLE_THRESHOLD) === (mean >= VISIBLE_THRESHOLD)) stateHits++;
      }
    }
    return {
      horizon: h,
      samples: errors.length,
      mae: errors.length ? round1(errors.reduce((s, e) => s + Math.abs(e), 0) / errors.length) : null,
      bias: errors.length ? round1(errors.reduce((s, e) => s + e, 0) / errors.length) : null,
      stateSamples,
      stateAccuracy: stateSamples ? Math.round((stateHits / stateSamples) * 100) : null,
    };
  });

  const sighted = readings.filter((r) => (r.signals?.spotters ?? 0) > 0 && r.state !== "night");
  const modelSaidOut = sighted.filter((r) => r.state === "out").length;

  const withTelemetry = readings.filter((r) => r.signals);
  const withIssues = withTelemetry.filter((r) => (r.signals?.qa?.length ?? 0) > 0);
  const issueCounts: Record<string, number> = {};
  for (const r of withIssues) {
    for (const issue of r.signals!.qa) {
      const kind = issue.split(/[:=]/).slice(0, 2).join(":");
      issueCounts[kind] = (issueCounts[kind] ?? 0) + 1;
    }
  }
  const latest = [...withIssues].sort((a, b) => b.ts.localeCompare(a.ts))[0];

  // Expected slots: every 15 minutes from the first logged reading in the
  // window (logging may have started recently) up to now.
  const SLOT_MS = 15 * 60 * 1000;
  const first = readings.reduce<number | null>((m, r) => {
    const t = new Date(r.ts).getTime();
    return m === null || t < m ? t : m;
  }, null);
  const expected = first === null ? 0 : Math.floor((now.getTime() - first) / SLOT_MS) + 1;

  return {
    days,
    forecast,
    community: {
      readingsWithSightings: sighted.length,
      modelSaidOut,
      agreement: sighted.length ? Math.round((modelSaidOut / sighted.length) * 100) : null,
    },
    quality: {
      readingsWithTelemetry: withTelemetry.length,
      readingsWithIssues: withIssues.length,
      passRate: withTelemetry.length
        ? Math.round(((withTelemetry.length - withIssues.length) / withTelemetry.length) * 100)
        : null,
      issueCounts,
      latestIssue: latest ? { ts: latest.ts, issues: latest.signals!.qa } : null,
    },
    coverage: {
      logged: readings.length,
      expected,
      rate: expected ? Math.min(100, Math.round((readings.length / expected) * 100)) : null,
    },
  };
}
