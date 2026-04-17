import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Flame, Trophy, Calendar, Mountain } from "lucide-react";
import { NEIGHBORHOOD_LABELS } from "@/lib/visibility";
import { getHoodStanding, WINDOW_DAYS } from "@/lib/hoods";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://is-the-mountain-out.vercel.app";

export const revalidate = 600;

interface PageParams {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id } = await params;
  const label = NEIGHBORHOOD_LABELS[id];
  if (!label) return { title: "Hood not found" };

  const standing = await getHoodStanding(id).catch(() => null);
  const outDays = standing?.outDays ?? 0;
  const streak = standing?.currentStreak ?? 0;

  const title = `${label} · Hood Wars · Is the Mountain Out?`;
  const description = `${label} has caught Mt. Rainier ${outDays} of the last ${WINDOW_DAYS} days${streak > 1 ? ` with a ${streak}-day active streak` : ""}. Representing the ${label} skyline.`;

  const ogUrl = `${SITE_URL}/api/og?hoodwars=1&hood=${encodeURIComponent(id)}&days=${outDays}&streak=${streak}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/hoods/${id}`,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `${label} Hood Wars card` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function HoodPage({ params }: PageParams) {
  const { id } = await params;
  const label = NEIGHBORHOOD_LABELS[id];
  if (!label) notFound();

  const standing = await getHoodStanding(id).catch(() => null);

  return (
    <main className="flex-1 relative">
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to dashboard
        </Link>

        <header className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 font-semibold">
            Hood Wars
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-none">
            {label}
          </h1>
          <p className="text-sm text-slate-400">
            Representing the {label} skyline in the Mt. Rainier visibility league.
          </p>
        </header>

        <section className="grid grid-cols-3 gap-3">
          <Stat
            icon={Calendar}
            label={`Out-days`}
            value={`${standing?.outDays ?? 0}`}
            sub={`of last ${WINDOW_DAYS}`}
            accent="amber"
          />
          <Stat
            icon={Flame}
            label="Current streak"
            value={`${standing?.currentStreak ?? 0}`}
            sub="days in a row"
            accent="orange"
          />
          <Stat
            icon={Trophy}
            label="Longest streak"
            value={`${standing?.longestStreak ?? 0}`}
            sub={`last ${WINDOW_DAYS}d`}
            accent="violet"
          />
        </section>

        <section className="rounded-2xl ring-1 ring-white/[0.06] bg-white/[0.02] p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Mountain className="w-4 h-4 text-emerald-400" />
            <h2 className="font-display text-sm font-bold text-white">Today</h2>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-bold text-white tabular-nums">
              {standing?.todayScore ?? 0}
            </span>
            <span className="text-sm text-slate-500">/ 100</span>
          </div>
          <p className="text-xs text-slate-500">
            Average over the last {WINDOW_DAYS} days: <span className="text-white/80 font-semibold">{standing?.avgScore ?? 0}/100</span>
          </p>
        </section>

        <section className="flex flex-wrap gap-3">
          <Link
            href={`/?hood=${encodeURIComponent(id)}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-bold text-emerald-200 bg-emerald-500/15 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25 transition-all"
          >
            Live dashboard for {label}
          </Link>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${label} has caught Mt. Rainier ${standing?.outDays ?? 0} of the last ${WINDOW_DAYS} days. Rep the hood.`)}&url=${encodeURIComponent(`${SITE_URL}/hoods/${id}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/80 bg-white/[0.05] ring-1 ring-white/[0.08] hover:bg-white/[0.08] transition-all"
          >
            Rep {label}
          </a>
        </section>

        <p className="text-[11px] text-slate-600 tracking-wide pt-6 border-t border-white/[0.05]">
          Standings refresh hourly via cron. Data since inception of the league.
        </p>
      </div>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Mountain;
  label: string;
  value: string;
  sub: string;
  accent: "amber" | "orange" | "violet";
}) {
  const ring =
    accent === "amber"
      ? "ring-amber-400/20"
      : accent === "orange"
        ? "ring-orange-400/20"
        : "ring-violet-400/20";
  const bg =
    accent === "amber"
      ? "bg-amber-500/8"
      : accent === "orange"
        ? "bg-orange-500/8"
        : "bg-violet-500/8";
  const fg =
    accent === "amber"
      ? "text-amber-300"
      : accent === "orange"
        ? "text-orange-300"
        : "text-violet-300";
  return (
    <div className={`rounded-2xl ring-1 ${ring} ${bg} p-3.5`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${fg}`} />
        <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold truncate">{label}</p>
      </div>
      <p className="font-display text-2xl font-bold text-white tabular-nums mt-1">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}
