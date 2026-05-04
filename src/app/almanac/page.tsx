import type { Metadata } from "next";
import Link from "next/link";
import { getAlmanacStats } from "@/lib/almanac";
import AlmanacClient from "@/components/AlmanacClient";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Mt. Rainier Almanac: Seattle visibility records & stats",
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
    <main className="flex-1 relative bg-[var(--background)]">
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <header className="space-y-3">
          <Link
            href="/"
            className="inline-block text-xs text-[color:var(--accent)] hover:text-[color:var(--type-1)] transition-colors"
          >
            &larr; IsTheMountainOut
          </Link>
          <h1 className="font-display font-bold text-[color:var(--type-1)] text-2xl sm:text-3xl">
            The Mt. Rainier Almanac
          </h1>
          <p className="text-sm text-[color:var(--type-3)] leading-relaxed max-w-2xl">
            Seattle&apos;s record book for Mt. Rainier visibility. Clear days,
            gloom streaks, monthly averages, all tracked since{" "}
            <span className="text-[color:var(--type-1)] font-semibold">{stats.sinceDate}</span>.
            Updated every 15 minutes.
          </p>
          <p className="text-[11px] text-[color:var(--type-4)] uppercase tracking-widest font-semibold">
            {stats.trackingDays} days on record &middot; generated{" "}
            {new Date(stats.generatedAt).toLocaleString("en-US", {
              timeZone: "America/Los_Angeles",
              dateStyle: "short",
              timeStyle: "short",
            })}{" "}
            PT
          </p>
        </header>

        <AlmanacClient stats={stats} />

        <section className="pt-6 border-t border-gray-200 space-y-2">
          <h2 className="font-display font-bold text-[color:var(--type-1)] text-sm">
            For journalists
          </h2>
          <p className="text-xs text-[color:var(--type-3)] leading-relaxed">
            All numbers on this page are available as JSON at{" "}
            <a
              href="/api/stats.json"
              className="text-[color:var(--accent)] hover:text-[color:var(--type-1)] underline"
            >
              /api/stats.json
            </a>
            . No key required. Cached 15 min. CORS-enabled. Attribution:{" "}
            <span className="text-[color:var(--type-1)]">IsTheMountainOut.com</span>.
          </p>
          <p className="text-xs text-[color:var(--type-4)] leading-relaxed">
            Reach out:{" "}
            <a
              href="https://x.com/jatin_batra1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--accent)] hover:text-[color:var(--type-1)]"
            >
              @jatin_batra1
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
