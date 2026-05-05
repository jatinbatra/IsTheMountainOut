import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export interface CalendarDay {
  date: string;
  score: number;
  isVisible: boolean;
}

type CalendarData = Record<string, { score: number; isVisible: boolean }>;

function todayPT(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

function addDaysPT(base: string, offset: number): string {
  const d = new Date(`${base}T12:00:00-07:00`);
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

export async function GET() {
  const days: CalendarDay[] = [];
  const today = todayPT();

  try {
    const data = await kv.get<CalendarData>("calendar:data");
    const lookup = data || {};

    for (let i = 29; i >= 0; i--) {
      const dateStr = addDaysPT(today, -i);
      const entry = lookup[dateStr];

      days.push({
        date: dateStr,
        score: entry?.score ?? -1,
        isVisible: entry?.isVisible ?? false,
      });
    }
  } catch {
    for (let i = 29; i >= 0; i--) {
      const dateStr = addDaysPT(today, -i);
      days.push({ date: dateStr, score: -1, isVisible: false });
    }
  }

  return NextResponse.json(
    { days },
    { headers: { "Cache-Control": "public, max-age=900" } }
  );
}
