import type { Metadata } from "next";
import Link from "next/link";
import { getAlmanacStats } from "@/lib/almanac";
import AlmanacClient from "@/components/AlmanacClient";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Mt. Rainier Almanac — Seattle visibility records & stats",
  description:
    "Year-to-date clear days, longest gloom streaks, monthly averages, and record-book stats for Mt. Rainier visibility from Seattle. Free press API included.",
  openGraph: {
    title: "Mt. Rainier Almanac",
    description:
      "Seattle's record book of mountain-visible days. YTD, streaks, monthly averages, press-ready quotes.",
    type: "website",
  },
};

export default async function AlmanacPage() {
  const stats = await getAlmanacStats();
  return (
    <main className="flex-1 relative">
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <header className="space-y-3">
          <Link
            href="/"
            className="inline-block text-xs text-blue-400/60 hover:text-blue-300 transition-colors"
          >
            ← IsTheMountainOut
          </Link>
          <h1 className="font-display font-bold text-white text-2xl sm:text-3xl">
            The Mt. Rainier Almanac
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            Seattle&apos;s record book for Mt. Rainier visibility. Clear days,
            gloom streaks, monthly averages, all tracked since{" "}
            <span className="text-white font-semibold">{stats.sinceDate}</span>.
            Updated every 15 minutes.
          </p>
          <p className="text-[11px] text-slate-600 uppercase tracking-widest font-semibold">
            {stats.trackingDays} days on record · generated{" "}
            {new Date(stats.generatedAt).toLocaleString("en-US", {
              timeZone: "America/Los_Angeles",
              dateStyle: "short",
              timeStyle: "short",
            })}{" "}
            PT
          </p>
        </header>

        <AlmanacClient stats={stats} />

        <section className="pt-6 border-t border-white/[0.06] space-y-2">
          <h2 className="font-display font-bold text-white text-sm">
            For journalists
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            All numbers on this page are available as JSON at{" "}
            <a
              href="/api/stats.json"
              className="text-blue-300 hover:text-blue-200 underline"
            >
              /api/stats.json
            </a>
            . No key required. Cached 15 min. CORS-enabled. Attribution:{" "}
            <span className="text-white">IsTheMountainOut.com</span>.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Reach out:{" "}
            <a
              href="https://x.com/jatin_batra1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400/70 hover:text-blue-300"
            >
              @jatin_batra1
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
