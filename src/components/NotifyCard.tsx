"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Share, Plus, Loader2, BellRing } from "lucide-react";
import {
  isNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerSW,
  subscribeToPush,
} from "@/lib/notifications";

type Platform = "standard" | "ios-safari-browser" | "ios-pwa" | "unsupported";

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
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "sent" | "failed">("idle");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setPermission(getNotificationPermission());
    const lookupEndpoint = async () => {
      if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        setEndpoint(sub.endpoint);
      }
    };
    lookupEndpoint();
    const retryTimer = setTimeout(lookupEndpoint, 2000);
    return () => clearTimeout(retryTimer);
  }, []);

  const canEnable = platform === "standard" || platform === "ios-pwa";
  const enabled = permission === "granted";

  const ensureSubscribedAndTest = async (): Promise<boolean> => {
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError("VAPID key not configured. Push notifications are not set up on this deployment.");
        return false;
      }
      const reg = await registerSW();
      if (!reg) { setError("Service worker failed to register."); return false; }
      const sub = await subscribeToPush(reg, vapidKey);
      if (!sub) { setError("Could not create push subscription."); return false; }
      setEndpoint(sub.endpoint);

      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      if (res.ok) return true;
      const data = await res.json().catch(() => ({}));
      setError(`Test failed: ${data.error || res.status}${data.detail ? ". " + data.detail : ""}`);
      return false;
    } catch {
      setError("Network error. Check your connection and try again.");
      return false;
    }
  };

  const fireTestPing = async (ep: string) => {
    setTesting(true);
    setTestResult("idle");
    setError(null);
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: ep }),
      });
      if (res.ok) {
        setTestResult("sent");
        setVerified(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.error === "subscription_not_found" || data.error === "subscription_expired" || data.error === "subscription_lookup_failed") {
        setError("Syncing your subscription to the server...");
        const ok = await ensureSubscribedAndTest();
        if (ok) {
          setTestResult("sent");
          setVerified(true);
          setError(null);
          return;
        }
      } else if (data.error === "push_not_configured") {
        setError("Push not configured on the server. VAPID keys may be missing from Vercel env vars.");
      } else if (data.error === "vapid_config_error") {
        setError(`VAPID key format error: ${data.detail || "check your env vars"}`);
      } else {
        setError(`Test failed: ${data.error || res.status}${data.detail ? ". " + data.detail : ""}`);
      }
      setTestResult("failed");
    } catch {
      setTestResult("failed");
      setError("Network error. Check your connection.");
    } finally {
      setTesting(false);
    }
  };

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
      const ok = await ensureSubscribedAndTest();
      if (ok) {
        setTestResult("sent");
        setVerified(true);
      }
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {enabled && verified ? (
            <div className="w-8 h-8 rounded-xl bg-[#2d8a4e]/10 flex items-center justify-center">
              <BellRing className="w-4 h-4 text-[#2d8a4e]" aria-hidden="true" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
              <Bell className="w-4 h-4 text-[color:var(--type-4)]" aria-hidden="true" />
            </div>
          )}
          <h3 className="font-medium text-sm text-[color:var(--type-1)]">
            {enabled ? (verified ? "Alerts active" : "Alerts enabled") : "Push alerts"}
          </h3>
        </div>
        {enabled && verified && (
          <span className="text-[10px] font-medium text-[#2d8a4e] bg-[#2d8a4e]/10 px-2 py-1 rounded-full">Working</span>
        )}
      </div>

      {enabled ? (
        <p className="text-sm text-[color:var(--type-3)] leading-relaxed">
          We check conditions every 15 minutes. When the mountain emerges, alpenglow is likely,
          or a gloom streak breaks, you get a push notification. Max one alert every 4 hours.
        </p>
      ) : (
        <p className="text-sm text-[color:var(--type-3)] leading-relaxed">
          {platform === "ios-safari-browser"
            ? "On iPhone, Safari blocks web push unless you install this app to your Home Screen first."
            : "Get notified when the mountain comes out, alpenglow is likely, or a gloom streak breaks."}
        </p>
      )}

      {platform === "ios-safari-browser" ? (
        <div className="space-y-2 text-sm text-[color:var(--type-3)]">
          <p className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-mono text-[color:var(--type-4)]">1</span>
            Tap <Share className="w-3.5 h-3.5 inline text-[color:var(--type-3)]" /> Share
          </p>
          <p className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-mono text-[color:var(--type-4)]">2</span>
            Pick <Plus className="w-3.5 h-3.5 inline text-[color:var(--type-3)]" /> Add to Home Screen
          </p>
          <p className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-mono text-[color:var(--type-4)]">3</span>
            Open from Home Screen, then enable alerts here.
          </p>
        </div>
      ) : platform === "unsupported" ? (
        <p className="text-sm text-[color:var(--type-4)]">
          Your browser doesn&apos;t support push. Try Chrome, Firefox, or Edge.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            {canEnable && !enabled && (
              <button
                onClick={handleEnable}
                disabled={subscribing || permission === "denied"}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[color:var(--accent)] text-white rounded-xl hover:opacity-90 transition-colors disabled:opacity-40"
              >
                {subscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enabling...
                  </>
                ) : permission === "denied" ? (
                  "Blocked in browser settings"
                ) : (
                  "Turn on alerts"
                )}
              </button>
            )}
            {enabled && endpoint && (
              <button
                onClick={() => fireTestPing(endpoint)}
                disabled={testing}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-colors disabled:opacity-40 ${
                  testResult === "sent"
                    ? "bg-[#2d8a4e]/10 text-[#2d8a4e] border border-[#2d8a4e]/20"
                    : testResult === "failed"
                      ? "bg-red-50 text-red-500 border border-red-200"
                      : "border border-gray-200 text-[color:var(--type-1)] hover:border-gray-300"
                }`}
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : testResult === "sent" ? (
                  <>
                    <Check className="w-4 h-4" />
                    Delivered
                  </>
                ) : testResult === "failed" ? (
                  "Retry test"
                ) : (
                  "Send test notification"
                )}
              </button>
            )}
            {enabled && !endpoint && (
              <button
                onClick={() => ensureSubscribedAndTest().then(ok => { if (ok) { setTestResult("sent"); setVerified(true); setError(null); } })}
                disabled={subscribing}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 text-[color:var(--type-1)] hover:border-gray-300 transition-colors disabled:opacity-40"
              >
                Re-subscribe
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
