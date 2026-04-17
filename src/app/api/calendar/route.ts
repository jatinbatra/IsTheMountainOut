import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export interface CalendarDay {
  date: string;
  score: number;
  isVisible: boolean;
}

type CalendarData = Record<string, { score: number; isVisible: boolean }>;

export async function GET() {
  const days: CalendarDay[] = [];
  const today = new Date();

  try {
    const data = await kv.get<CalendarData>("calendar:data");
    const lookup = data || {};

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const entry = lookup[dateStr];

      days.push({
        date: dateStr,
        score: entry?.score ?? -1,
        isVisible: entry?.isVisible ?? false,
      });
    }
  } catch {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().split("T")[0], score: -1, isVisible: false });
    }
  }

  return NextResponse.json(
    { days },
    { headers: { "Cache-Control": "public, max-age=900" } }
  );
}
