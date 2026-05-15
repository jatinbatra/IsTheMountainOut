import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export interface CalendarDay {
  date: string;
  score: number;
  isVisible: boolean;
}

type CalendarData = Record<string, { score: number; isVisible: boolean }>;

function todayPT(): string {
  // Use Intl to get consistent YYYY-MM-DD in PT
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDaysPT(base: string, offset: number): string {
  const [y, m, d] = base.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0); // Noon to avoid DST issues
  date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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
