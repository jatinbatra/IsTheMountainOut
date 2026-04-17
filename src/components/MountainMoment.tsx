"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Share2,
  Download,
  X,
  Flame,
  Check,
  Copy,
  Loader2,
  Camera,
} from "lucide-react";
import { getStreak, recordVisit, type StreakState } from "@/lib/streak";

interface Props {
  isVisible: boolean;
  score: number;
  neighborhoodLabel: string | null;
  durationMessage: string;
}

type CaptureState = "idle" | "rendering" | "ready" | "sharing" | "copied" | "saved";

const CARD_W = 1080;
const CARD_H = 1920;

function formatTime(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  opts: {
    isVisible: boolean;
    score: number;
    neighborhoodLabel: string | null;
    streak: StreakState;
    time: string;
    date: string;
  },
) {
  const { isVisible, score, neighborhoodLabel, streak, time, date } = opts;

  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
  if (isVisible) {
    bg.addColorStop(0, "#030b1a");
    bg.addColorStop(0.55, "#052e4a");
    bg.addColorStop(1, "#064e3b");
  } else {
    bg.addColorStop(0, "#07090e");
    bg.addColorStop(0.55, "#0f172a");
    bg.addColorStop(1, "#1e293b");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const accent = isVisible ? "#34d399" : "#f87171";
  const accentSoft = isVisible ? "rgba(52,211,153,0.18)" : "rgba(248,113,113,0.14)";

  const glow = ctx.createRadialGradient(CARD_W / 2, CARD_H * 0.42, 40, CARD_W / 2, CARD_H * 0.42, 720);
  glow.addColorStop(0, accentSoft);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "600 28px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("IS THE MOUNTAIN OUT?", 72, 120);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "500 26px 'Inter', system-ui, sans-serif";
  ctx.fillText(date, CARD_W - 72, 120);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 34px 'Inter', system-ui, sans-serif";
  const subHeader = neighborhoodLabel
    ? `From ${neighborhoodLabel}, Seattle`
    : "From Seattle";
  ctx.fillText(subHeader, CARD_W / 2, 260);

  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 60;
  ctx.fillStyle = accent;
  ctx.font = "900 520px 'Space Grotesk', 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isVisible ? "YES" : "NO", CARD_W / 2, CARD_H * 0.42);
  ctx.restore();

  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 140px 'Space Grotesk', 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${score}`, CARD_W / 2 - 70, CARD_H * 0.58);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 56px 'Space Grotesk', 'Inter', system-ui, sans-serif";
  ctx.fillText("/ 100", CARD_W / 2 + 110, CARD_H * 0.58);

  const horizonY = CARD_H * 0.72;
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(0, horizonY, CARD_W, 4);

  const peakX = CARD_W / 2;
  const peakY = horizonY - 230;
  ctx.beginPath();
  ctx.moveTo(peakX - 380, horizonY);
  ctx.lineTo(peakX - 120, peakY + 80);
  ctx.lineTo(peakX - 40, peakY);
  ctx.lineTo(peakX + 60, peakY + 60);
  ctx.lineTo(peakX + 180, peakY + 40);
  ctx.lineTo(peakX + 380, horizonY);
  ctx.closePath();
  ctx.fillStyle = isVisible ? "rgba(148,163,184,0.22)" : "rgba(71,85,105,0.18)";
  ctx.fill();

  if (isVisible) {
    ctx.beginPath();
    ctx.moveTo(peakX - 120, peakY + 80);
    ctx.lineTo(peakX - 40, peakY);
    ctx.lineTo(peakX + 60, peakY + 60);
    ctx.lineTo(peakX + 30, peakY + 90);
    ctx.lineTo(peakX - 20, peakY + 70);
    ctx.lineTo(peakX - 80, peakY + 110);
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();
  }

  const badgeY = CARD_H * 0.82;
  if (streak.current >= 2) {
    const badgeW = 420;
    const badgeH = 110;
    const badgeX = (CARD_W - badgeW) / 2;
    ctx.fillStyle = "rgba(251,146,60,0.12)";
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 55);
    ctx.fill();
    ctx.strokeStyle = "rgba(251,146,60,0.35)";
    ctx.lineWidth = 2;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 55);
    ctx.stroke();

    ctx.fillStyle = "#fb923c";
    ctx.font = "800 54px 'Space Grotesk', 'Inter', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `🔥 ${streak.current}-day streak`,
      CARD_W / 2,
      badgeY + badgeH / 2 + 20,
    );
  } else if (streak.totalCaught >= 1) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "600 38px 'Inter', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `${streak.totalCaught} mountain days caught`,
      CARD_W / 2,
      badgeY + 65,
    );
  }

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "500 28px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `${time} PT · isthemountainout.com`,
    CARD_W / 2,
    CARD_H - 80,
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function MountainMoment({
  isVisible,
  score,
  neighborhoodLabel,
  durationMessage,
}: Props) {
  const [open, setOpen] = useState(false);
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [streak, setStreak] = useState<StreakState>(() => getStreak());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setStreak(recordVisit(isVisible));
  }, [isVisible]);

  const currentStreak = streak.current;
  const ctaLabel = useMemo(() => {
    if (isVisible && currentStreak >= 3) return `Share Day ${currentStreak}`;
    if (isVisible) return "Capture the Moment";
    return "Share this forecast";
  }, [isVisible, currentStreak]);

  const render = useCallback(async () => {
    setCaptureState("rendering");
    const canvas = document.createElement("canvas");
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCaptureState("idle");
      return;
    }
    canvasRef.current = canvas;

    drawCard(ctx, {
      isVisible,
      score,
      neighborhoodLabel,
      streak,
      time: formatTime(),
      date: formatDate(),
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png", 0.95),
    );
    if (!blob) {
      setCaptureState("idle");
      return;
    }
    blobRef.current = blob;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
    setCaptureState("ready");
  }, [isVisible, score, neighborhoodLabel, streak, previewUrl]);

  const openModal = useCallback(() => {
    setOpen(true);
    render();
  }, [render]);

  const closeModal = useCallback(() => {
    setOpen(false);
    setCaptureState("idle");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    blobRef.current = null;
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, closeModal]);

  const share = useCallback(async () => {
    const blob = blobRef.current;
    if (!blob) return;

    const hoodPart = neighborhoodLabel ? ` from ${neighborhoodLabel}` : "";
    const text = `Mt. Rainier is ${isVisible ? "OUT" : "hiding"}${hoodPart} — ${score}/100. ${durationMessage}`;
    const url = neighborhoodLabel
      ? `https://isthemountainout.com/?hood=${encodeURIComponent(neighborhoodLabel.toLowerCase().replace(/\s+/g, "-"))}`
      : "https://isthemountainout.com";

    setCaptureState("sharing");

    const file = new File([blob], "mountain-moment.png", { type: "image/png" });

    try {
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({
          title: "Is the Mountain Out?",
          text,
          url,
          files: [file],
        });
        setCaptureState("ready");
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "Is the Mountain Out?", text, url });
        setCaptureState("ready");
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCaptureState("copied");
      setTimeout(() => setCaptureState("ready"), 2200);
    } catch {
      setCaptureState("ready");
    }
  }, [isVisible, score, neighborhoodLabel, durationMessage]);

  const download = useCallback(() => {
    const blob = blobRef.current;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mountain-${isVisible ? "out" : "hiding"}-${score}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCaptureState("saved");
    setTimeout(() => setCaptureState("ready"), 2200);
  }, [isVisible, score]);

  const copyCaption = useCallback(async () => {
    const hoodPart = neighborhoodLabel ? ` from ${neighborhoodLabel}` : "";
    const caption = `Mt. Rainier is ${isVisible ? "OUT" : "hiding"}${hoodPart} — ${score}/100 ${isVisible ? "🏔️" : "☁️"}\n\n${durationMessage}\n\nisthemountainout.com`;
    try {
      await navigator.clipboard.writeText(caption);
      setCaptureState("copied");
      setTimeout(() => setCaptureState("ready"), 2200);
    } catch {
      // ignore
    }
  }, [isVisible, score, neighborhoodLabel, durationMessage]);

  const shareBtnClass = isVisible
    ? "bg-gradient-to-br from-emerald-500/30 via-emerald-400/20 to-blue-500/25 ring-1 ring-emerald-400/40 hover:ring-emerald-300/60 shadow-lg shadow-emerald-500/10"
    : "bg-gradient-to-br from-rose-500/30 via-rose-400/20 to-blue-500/25 ring-1 ring-rose-400/40 hover:ring-rose-300/60 shadow-lg shadow-rose-500/10";

  return (
    <>
      <button
        onClick={openModal}
        className={`group relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-display font-bold text-sm transition-all overflow-hidden ${
          isVisible
            ? "bg-gradient-to-br from-emerald-500/25 via-emerald-400/15 to-blue-500/20 text-emerald-100 ring-1 ring-emerald-400/40 hover:ring-emerald-300/60 shadow-lg shadow-emerald-500/10"
            : "bg-gradient-to-br from-white/[0.08] to-white/[0.04] text-white/80 ring-1 ring-white/[0.12] hover:ring-white/25"
        }`}
        aria-label="Capture a shareable Mountain Moment"
      >
        <span
          className={`absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none`}
          aria-hidden="true"
        />
        <Sparkles
          className={`w-4 h-4 ${isVisible ? "text-emerald-300" : "text-white/60"} animate-pulse-slow`}
        />
        <span className="relative">{ctaLabel}</span>
        {streak.current >= 2 && isVisible && (
          <span className="relative inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-md bg-orange-500/20 ring-1 ring-orange-400/40 text-[10px] text-orange-200 font-bold tabular-nums">
            <Flame className="w-3 h-3" />
            {streak.current}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Share Mountain Moment"
        >
          <button
            onClick={closeModal}
            aria-label="Close"
            className="absolute inset-0 bg-black/75 backdrop-blur-xl animate-fade-up"
          />
          <div className="relative w-full sm:max-w-md mx-auto sm:mx-4 rounded-t-3xl sm:rounded-3xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 ring-1 ring-white/10 shadow-2xl p-5 sm:p-6 animate-fade-up max-h-[92vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-white text-lg">
                  Your Mountain Moment
                </h3>
                <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">
                  Ready for IG · Threads · TikTok
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg glass hover:bg-white/[0.08] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>

            <div
              className={`relative aspect-[9/16] w-full rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black ${
                captureState === "rendering" ? "animate-pulse" : ""
              }`}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Mountain Moment preview"
                  className="w-full h-full object-cover animate-fade-up"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                </div>
              )}
              {isVisible && captureState === "ready" && (
                <div
                  className="absolute inset-0 pointer-events-none animate-hero-glow"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 42%, rgba(52,211,153,0.18), transparent 60%)",
                  }}
                  aria-hidden="true"
                />
              )}
            </div>

            {streak.current >= 2 && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-orange-500/8 ring-1 ring-orange-400/20">
                <div className="flex-shrink-0 p-2 rounded-lg bg-orange-500/15">
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-bold text-orange-200">
                    Day {streak.current} in a row
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Best: {streak.best} · Total caught: {streak.totalCaught}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                onClick={share}
                disabled={captureState !== "ready" && captureState !== "copied" && captureState !== "saved"}
                className={`col-span-2 inline-flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-display font-bold text-sm transition-all disabled:opacity-50 text-white ${shareBtnClass}`}
              >
                {captureState === "sharing" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Opening share…
                  </>
                ) : captureState === "copied" ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied to clipboard
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share Moment
                  </>
                )}
              </button>

              <button
                onClick={download}
                disabled={captureState !== "ready" && captureState !== "saved"}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/80 bg-white/[0.05] ring-1 ring-white/[0.10] hover:bg-white/[0.08] transition-all disabled:opacity-40"
              >
                {captureState === "saved" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Saved
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Save PNG
                  </>
                )}
              </button>

              <button
                onClick={copyCaption}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-white/80 bg-white/[0.05] ring-1 ring-white/[0.10] hover:bg-white/[0.08] transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy caption
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] text-slate-500 leading-relaxed">
              <Camera className="w-3 h-3 inline -mt-0.5 mr-1 text-slate-600" />
              Tap Share Moment, then pick Instagram, Threads, iMessage, or anywhere
              else — the card attaches automatically.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
