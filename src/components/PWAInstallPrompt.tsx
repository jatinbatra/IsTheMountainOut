"use client";

import { useEffect, useState } from "react";
import { Download, X, Share2, Plus, Mountain } from "lucide-react";

const VISIT_KEY = "itmo:visits:v1";
const DISMISSED_KEY = "itmo:pwa-dismissed:v1";
const SHOW_AFTER_VISITS = 3;
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const navStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return (
    navStandalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;

    let visits = 0;
    try {
      visits = Number(window.localStorage.getItem(VISIT_KEY) || "0") + 1;
      window.localStorage.setItem(VISIT_KEY, String(visits));
    } catch {
      return;
    }

    let dismissedAt = 0;
    try {
      dismissedAt = Number(window.localStorage.getItem(DISMISSED_KEY) || "0");
    } catch {
      // ignore
    }
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return;
    if (visits < SHOW_AFTER_VISITS) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setPlatform("android");
      setTimeout(() => setShow(true), 800);
    };

    window.addEventListener("beforeinstallprompt", onBIP);

    let iosTimer: ReturnType<typeof setTimeout> | null = null;
    if (isIOS()) {
      iosTimer = setTimeout(() => {
        setPlatform("ios");
        setShow(true);
      }, 1200);
    }

    return () => {
      if (iosTimer) clearTimeout(iosTimer);
      window.removeEventListener("beforeinstallprompt", onBIP);
    };
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") {
      setShow(false);
    } else {
      dismiss();
    }
  };

  if (!show || !platform) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 animate-fade-up"
      role="dialog"
      aria-label="Install IsTheMountainOut"
    >
      <div className="rounded-2xl bg-slate-900/95 backdrop-blur-xl ring-1 ring-white/10 shadow-2xl shadow-black/40 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/80 to-violet-600/80 flex items-center justify-center ring-1 ring-white/10">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-white text-sm">
              Add to Home Screen
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {platform === "ios"
                ? "Get one-tap mountain checks — install IsTheMountainOut as an app."
                : "One tap to see if Mt. Rainier is out. No browser, no clutter."}
            </p>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 p-1 rounded-lg text-slate-500 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {platform === "android" && deferred && (
          <button
            onClick={install}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-bold text-white bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 transition-all"
          >
            <Download className="w-4 h-4" />
            Install app
          </button>
        )}

        {platform === "ios" && (
          <div className="mt-3 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]">
              <span className="font-mono font-bold text-slate-500 w-4">1.</span>
              <span>Tap</span>
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Share</span>
              <span className="text-slate-500">in Safari</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]">
              <span className="font-mono font-bold text-slate-500 w-4">2.</span>
              <span>Tap</span>
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold text-white/90">Add to Home Screen</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
