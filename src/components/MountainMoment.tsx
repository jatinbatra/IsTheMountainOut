"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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

interface Sponsor {
  id: string;
  label: string;
  brand: string;
  accent: string;
}

const SPONSORS: Sponsor[] = [
  { id: "rainier", label: "Rainier Beer", brand: "Rainier", accent: "#dc2626" },
  { id: "starbucks", label: "Starbucks Reserve", brand: "Starbucks Reserve", accent: "#065f46" },
  { id: "rei", label: "REI Co-op", brand: "REI", accent: "#dc2626" },
];

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
    hideWatermark: boolean;
    handle: string | null;
    sponsor: Sponsor | null;
  },
) {
  const { isVisible, score, neighborhoodLabel, streak, time, date, hideWatermark, handle, sponsor } = opts;

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

  const accent = isVisible ? "#94c8a3" : "#8a99a6";
  const accentSoft = isVisible ? "rgba(148,200,163,0.18)" : "rgba(138,153,166,0.14)";

  const glow = ctx.createRadialGradient(CARD_W / 2, CARD_H * 0.42, 40, CARD_W / 2, CARD_H * 0.42, 720);
  glow.addColorStop(0, accentSoft);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.fillStyle = "rgba(246,241,231,0.45)";
  ctx.font = "500 28px 'Inter', system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("IS THE MOUNTAIN OUT?", 72, 120);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(246,241,231,0.35)";
  ctx.font = "400 26px 'Inter', system-ui, sans-serif";
  ctx.fillText(date, CARD_W - 72, 120);

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(246,241,231,0.55)";
  ctx.font = "500 34px 'Inter', system-ui, sans-serif";
  const subHeader = neighborhoodLabel
    ? `From ${neighborhoodLabel}, Seattle`
    : "From Seattle";
  ctx.fillText(subHeader, CARD_W / 2, 260);

  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 60;
  ctx.fillStyle = accent;
  ctx.font = "300 520px 'Georgia', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isVisible ? "YES" : "NO", CARD_W / 2, CARD_H * 0.42);
  ctx.restore();

  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#f6f1e7";
  ctx.font = "300 140px 'Georgia', serif";
  ctx.textAlign = "center";
  ctx.fillText(`${score}`, CARD_W / 2 - 70, CARD_H * 0.58);
  ctx.fillStyle = "rgba(246,241,231,0.4)";
  ctx.font = "400 56px 'Inter', system-ui, sans-serif";
  ctx.fillText("/ 100", CARD_W / 2 + 110, CARD_H * 0.58);

  const horizonY = CARD_H * 0.72;
  ctx.fillStyle = "rgba(246,241,231,0.04)";
  ctx.fillRect(0, horizonY, CARD_W, 2);

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
    ctx.fillStyle = "rgba(212,130,92,0.12)";
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(212,130,92,0.35)";
    ctx.lineWidth = 1;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8);
    ctx.stroke();

    ctx.fillStyle = "#d4825c";
    ctx.font = "700 54px 'Inter', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `🔥 ${streak.current}-day streak`,
      CARD_W / 2,
      badgeY + badgeH / 2 + 20,
    );
  } else if (streak.totalCaught >= 1) {
    ctx.fillStyle = "rgba(246,241,231,0.5)";
    ctx.font = "400 38px 'Inter', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `${streak.totalCaught} mountain days caught`,
      CARD_W / 2,
      badgeY + 65,
    );
  }

  if (sponsor) {
    const sponsorY = CARD_H - 180;
    ctx.fillStyle = `${sponsor.accent}22`;
    roundRect(ctx, 72, sponsorY - 40, CARD_W - 144, 76, 4);
    ctx.fill();
    ctx.strokeStyle = `${sponsor.accent}55`;
    ctx.lineWidth = 1;
    roundRect(ctx, 72, sponsorY - 40, CARD_W - 144, 76, 4);
    ctx.stroke();

    ctx.fillStyle = "rgba(246,241,231,0.55)";
    ctx.font = "400 20px 'Inter', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("This Mountain Moment presented by", CARD_W / 2, sponsorY - 8);
    ctx.fillStyle = "#f6f1e7";
    ctx.font = "600 30px 'Inter', system-ui, sans-serif";
    ctx.fillText(sponsor.brand, CARD_W / 2, sponsorY + 22);
  }

  if (handle) {
    ctx.fillStyle = "rgba(212,130,92,0.85)";
    ctx.font = "500 32px 'Inter', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`@${handle}`, 72, CARD_H - 110);
  }

  ctx.fillStyle = "rgba(246,241,231,0.35)";
  ctx.font = "400 28px 'Inter', system-ui, sans-serif";
  ctx.textAlign = hideWatermark ? "left" : "center";
  const footer = hideWatermark
    ? `${time} PT`
    : `${time} PT · isthemountainout.com`;
  ctx.fillText(footer, hideWatermark ? 72 : CARD_W / 2, CARD_H - 60);
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
  const [sponsorId, setSponsorId] = useState<string | null>(null);
  const [handle, setHandle] = useState<string>("");
  const [hideWatermark, setHideWatermark] = useState<boolean>(false);
  const blobRef = useRef<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setHandle(window.localStorage.getItem("itmo:handle:v1") || "");
    } catch {
      // ignore
    }
  }, []);

  const sponsor = useMemo(
    () => (sponsorId ? SPONSORS.find((s) => s.id === sponsorId) ?? null : null),
    [sponsorId],
  );

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
      hideWatermark,
      handle,
      sponsor,
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
  }, [isVisible, score, neighborhoodLabel, streak, previewUrl, hideWatermark, handle, sponsor]);

  useEffect(() => {
    if (open) render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sponsorId, hideWatermark]);

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
    const text = `Mt. Rainier is ${isVisible ? "OUT" : "hiding"}${hoodPart} , ${score}/100. ${durationMessage}`;
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
    const caption = `Mt. Rainier is ${isVisible ? "OUT" : "hiding"}${hoodPart} , ${score}/100 ${isVisible ? "🏔️" : "☁️"}\n\n${durationMessage}\n\nisthemountainout.com`;
    try {
      await navigator.clipboard.writeText(caption);
      setCaptureState("copied");
      setTimeout(() => setCaptureState("ready"), 2200);
    } catch {
      // ignore
    }
  }, [isVisible, score, neighborhoodLabel, durationMessage]);

  return (
    <>
      <button
        onClick={openModal}
        className={`group inline-flex items-center gap-2.5 px-5 py-2.5 font-display text-sm transition-all ${
          isVisible
            ? "bg-[color:var(--accent-clear)]/[0.08] text-[color:var(--accent-clear)] border border-[color:var(--accent-clear)]/25 hover:border-[color:var(--accent-clear)]/50"
            : "border border-[var(--rule)] text-[color:var(--type-2)] hover:border-[var(--rule-strong)]"
        }`}
        aria-label="Capture a shareable Mountain Moment"
      >
        <Camera className="w-4 h-4" />
        <span>{ctaLabel}</span>
        {streak.current >= 2 && isVisible && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[color:var(--accent)] tabular">
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
          <div className="relative w-full sm:max-w-md mx-auto sm:mx-4 bg-[var(--ink-deep)] border border-[var(--rule-strong)] shadow-2xl p-5 sm:p-6 animate-fade-up max-h-[92vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-medium text-[color:var(--type-1)] text-lg">
                  Your Mountain Moment
                </h3>
                <p className="ticker mt-0.5">
                  Ready for IG · Threads · TikTok
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-[color:var(--type-4)] hover:text-[color:var(--type-2)] transition-colors border border-[var(--rule)]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className={`relative aspect-[9/16] w-full overflow-hidden ring-1 ring-[var(--rule)] bg-[var(--ink-deep)] ${
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
                  <Loader2 className="w-6 h-6 text-[color:var(--type-4)] animate-spin" />
                </div>
              )}
            </div>

            {streak.current >= 2 && (
              <div className="mt-4 flex items-center gap-3 p-3 border border-[color:var(--accent)]/20">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-medium text-[color:var(--accent)]">
                    Day {streak.current} in a row
                  </p>
                  <p className="ticker mt-0.5">
                    Best: {streak.best} · Total caught: {streak.totalCaught}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2.5">
              <label className="flex items-center justify-between gap-3 px-3 py-2.5 border border-[var(--rule)] text-xs cursor-pointer">
                <span className="flex items-center gap-2 font-display text-[color:var(--type-2)]">
                  Hide watermark
                </span>
                <input
                  type="checkbox"
                  className="accent-[color:var(--accent-clear)] w-4 h-4"
                  checked={hideWatermark}
                  onChange={(e) => setHideWatermark(e.target.checked)}
                />
              </label>

              <div className="px-3 py-2.5 border border-[var(--rule)]">
                <label className="ticker mb-1.5 block">
                  Your handle
                </label>
                <input
                  type="text"
                  placeholder="@yourname (optional)"
                  value={handle}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 24).replace(/[^\w\-. ]/g, "");
                    setHandle(v);
                    try {
                      window.localStorage.setItem("itmo:handle:v1", v);
                    } catch {
                      // ignore
                    }
                  }}
                  className="w-full px-3 py-2 bg-[color:var(--type-1)]/[0.04] border border-[var(--rule)] text-xs text-[color:var(--type-1)] placeholder:text-[color:var(--type-4)] focus:outline-none focus:border-[var(--rule-strong)]"
                  maxLength={24}
                />
              </div>

              <div className="px-3 py-2.5 border border-[var(--rule)]">
                <div className="flex items-center justify-between">
                  <span className="ticker">
                    Sponsor (opt-in)
                  </span>
                  {sponsorId && (
                    <button
                      onClick={() => setSponsorId(null)}
                      className="ticker hover:text-[color:var(--type-2)] underline underline-offset-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SPONSORS.map((s) => {
                    const active = sponsorId === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSponsorId(active ? null : s.id)}
                        className={`px-2.5 py-1 text-[11px] font-mono tracking-wide transition-all border ${
                          active
                            ? "text-[color:var(--type-1)] border-[color:var(--accent)]/40"
                            : "text-[color:var(--type-3)] border-[var(--rule)] hover:border-[var(--rule-strong)]"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 ticker leading-relaxed">
                  Tag a local brand on your card. Earn rewards when sponsors are live.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                onClick={share}
                disabled={captureState !== "ready" && captureState !== "copied" && captureState !== "saved"}
                className={`col-span-2 inline-flex items-center justify-center gap-2.5 px-4 py-3.5 font-display text-sm transition-all disabled:opacity-50 ${
                  isVisible
                    ? "bg-[color:var(--accent-clear)]/[0.1] text-[color:var(--accent-clear)] border border-[color:var(--accent-clear)]/25"
                    : "bg-[color:var(--type-1)]/[0.06] text-[color:var(--type-1)] border border-[var(--rule-strong)]"
                }`}
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
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-display text-[color:var(--type-2)] border border-[var(--rule)] hover:border-[var(--rule-strong)] transition-all disabled:opacity-40"
              >
                {captureState === "saved" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[color:var(--accent-clear)]" />
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
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-display text-[color:var(--type-2)] border border-[var(--rule)] hover:border-[var(--rule-strong)] transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy caption
              </button>
            </div>

            <p className="mt-4 text-center ticker leading-relaxed">
              <Camera className="w-3 h-3 inline -mt-0.5 mr-1" />
              Tap Share Moment, then pick Instagram, Threads, iMessage, or anywhere
              else. The card attaches automatically.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
