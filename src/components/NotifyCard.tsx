"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Share, Plus, Loader2, Sparkles, Sunrise, Sunset, Cloud, TrendingUp, CalendarDays } from "lucide-react";
import {
  isNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerSW,
  subscribeToPush,
} from "@/lib/notifications";

type Platform = "standard" | "ios-safari-browser" | "ios-pwa" | "unsupported";

const ALERTS: { icon: typeof Bell; label: string; desc: string }[] = [
  { icon: Sparkles, label: "Alpenglow", desc: "Rainier turning pink at sunset" },
  { icon: TrendingUp, label: "Mountain OUT", desc: "After 6+ hours of hiding" },
  { icon: Cloud, label: "Gloom broken", desc: "Clear skies after 3+ gloomy days" },
  { icon: Sunset, label: "Prime sunset", desc: "Crystal clear 90min before sunset" },
  { icon: Sunrise, label: "Dawn patrol", desc: "Clear sunrise — fires 30min before" },
  { icon: Sunrise, label: "Morning brief", desc: "Daily 7am status + next window" },
  { icon: CalendarDays, label: "Weekend look-ahead", desc: "Friday 5pm weekend forecast" },
];

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unsupported";
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  if (isIOS) {
    if (isStandalone) return "ios-pwa";
    return "ios-safari-browser";
  }
  if (isNotificationsSupported()) return "standard";
  return "unsupported";
}

export default function NotifyCard() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [platform, setPlatform] = useState<Platform>("standard");
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setPermission(getNotificationPermission());
  }, []);

  const canEnable = platform === "standard" || platform === "ios-pwa";
  const enabled = permission === "granted";

  const handleEnable = async () => {
    setSubscribing(true);
    setError(null);
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setPermission("denied");
        setError("Permission denied. Enable it in your browser settings to turn alerts back on.");
        return;
      }
      setPermission("granted");
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError("Alerts aren't fully configured yet — we'll email you when they go live.");
        return;
      }
      const reg = await registerSW();
      if (!reg) {
        setError("Couldn't register the service worker. Try reloading the page.");
        return;
      }
      const sub = await subscribeToPush(reg, vapidKey);
      if (!sub) {
        setError("Subscription failed. Check your browser settings and retry.");
      }
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="rounded-2xl ring-1 ring-white/[0.08] bg-gradient-to-br from-blue-500/[0.06] via-white/[0.02] to-violet-500/[0.06] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 p-2 rounded-xl ring-1 ${
            enabled
              ? "bg-emerald-500/15 ring-emerald-400/25"
              : "bg-blue-500/10 ring-blue-400/20"
          }`}
        >
          {enabled ? (
            <Check className="w-4 h-4 text-emerald-300" aria-hidden="true" />
          ) : (
            <Bell className="w-4 h-4 text-blue-300" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-blue-300/80">
            {enabled ? "Alerts on" : "Never miss a clear day"}
          </p>
          <h3 className="text-sm font-display font-bold text-white mt-0.5">
            {enabled
              ? "You'll get pinged when it matters."
              : "Free push alerts. 6 types. No spam."}
          </h3>
          <p className="text-xs text-white/55 mt-1 leading-relaxed">
            {platform === "ios-safari-browser"
              ? "On iPhone: Safari blocks web push unless you install this app to your Home Screen first."
              : enabled
                ? "We'll only ping you for genuinely worthwhile moments — alpenglow, rare clarity, or the gloom breaking."
                : "Tap once. We'll ping you when Rainier is actually worth seeing — and never more than once every few hours."}
          </p>
        </div>
      </div>

      {platform === "ios-safari-browser" ? (
        <ol className="mt-4 space-y-2 text-xs text-white/70">
          <li className="flex items-center gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.06] ring-1 ring-white/[0.08] text-[10px] font-bold text-white/80 flex items-center justify-center">1</span>
            <span className="flex items-center gap-1.5">
              Tap <Share className="w-3.5 h-3.5 inline text-blue-300" /> Share
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.06] ring-1 ring-white/[0.08] text-[10px] font-bold text-white/80 flex items-center justify-center">2</span>
            <span className="flex items-center gap-1.5">
              Pick <Plus className="w-3.5 h-3.5 inline text-blue-300" /> Add to Home Screen
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.06] ring-1 ring-white/[0.08] text-[10px] font-bold text-white/80 flex items-center justify-center">3</span>
            <span>Open it from Home Screen, then come back here to enable alerts.</span>
          </li>
        </ol>
      ) : platform === "unsupported" ? (
        <p className="mt-4 text-xs text-white/50">
          Your browser doesn&apos;t support push alerts yet. Try Chrome, Firefox, or Edge.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {canEnable && !enabled && (
              <button
                onClick={handleEnable}
                disabled={subscribing || permission === "denied"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display font-bold bg-gradient-to-r from-blue-500/35 to-violet-500/35 text-white ring-1 ring-blue-400/40 shadow-lg shadow-blue-500/10 hover:ring-blue-300/60 transition-all disabled:opacity-50"
              >
                {subscribing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Enabling…
                  </>
                ) : permission === "denied" ? (
                  "Blocked in browser settings"
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    Turn on alerts
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-[11px] font-semibold text-white/50 hover:text-white/80 transition-colors"
              aria-expanded={expanded}
            >
              {expanded ? "Hide alert types" : "What will I get?"}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-[11px] text-rose-300/90 font-medium">{error}</p>
          )}
        </>
      )}

      {expanded && (
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALERTS.map(({ icon: Icon, label, desc }) => (
            <li
              key={label}
              className="flex items-start gap-2.5 rounded-xl px-3 py-2 bg-white/[0.02] ring-1 ring-white/[0.05]"
            >
              <Icon className="w-3.5 h-3.5 text-blue-300/80 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white/85">{label}</p>
                <p className="text-[11px] text-white/50 leading-snug">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
