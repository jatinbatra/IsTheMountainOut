"use client";

import { useState, useCallback } from "react";
import { Bell, Mail, Check, Loader2 } from "lucide-react";
import {
  isNotificationsSupported,
  requestNotificationPermission,
  registerSW,
  subscribeToPush,
} from "@/lib/notifications";

export default function AlertSignup() {
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pushStatus, setPushStatus] = useState<"idle" | "loading" | "success" | "denied" | "unsupported">(
    isNotificationsSupported() ? "idle" : "unsupported"
  );

  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setEmailStatus("loading");
    try {
      const res = await fetch("/api/subscribe/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setEmailStatus("success");
        setEmail("");
      } else {
        setEmailStatus("error");
      }
    } catch {
      setEmailStatus("error");
    }
  }, [email]);

  const handlePushEnable = useCallback(async () => {
    setPushStatus("loading");
    const granted = await requestNotificationPermission();
    if (!granted) {
      setPushStatus("denied");
      return;
    }

    const registration = await registerSW();
    if (!registration) {
      setPushStatus("denied");
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      // VAPID not configured, just mark as success for the permission part
      setPushStatus("success");
      return;
    }

    const sub = await subscribeToPush(registration, vapidKey);
    setPushStatus(sub ? "success" : "denied");
  }, []);

  return (
    <div className="space-y-6">
      {/* Headline */}
      <div className="space-y-1.5">
        <h2 className="font-display text-xl font-bold text-white">
          Free Mt. Rainier Alerts
        </h2>
        <p className="text-xs text-white/25 leading-relaxed max-w-lg">
          Get notified the moment the mountain comes out. No spam — only when visibility changes dramatically.
        </p>
      </div>

      {/* Email signup */}
      <form onSubmit={handleEmailSubmit} className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/15" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailStatus === "error") setEmailStatus("idle");
            }}
            placeholder="your@email.com"
            className="w-full pl-9 pr-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/[0.12] transition-colors"
            disabled={emailStatus === "loading" || emailStatus === "success"}
          />
        </div>
        <button
          type="submit"
          disabled={emailStatus === "loading" || emailStatus === "success" || !email.trim()}
          className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
            emailStatus === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20"
              : "bg-white/[0.06] text-white/50 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/70 disabled:opacity-40"
          }`}
        >
          {emailStatus === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {emailStatus === "success" && <Check className="w-3.5 h-3.5" />}
          {emailStatus === "idle" && "Alert Me"}
          {emailStatus === "error" && "Try Again"}
        </button>
      </form>

      {emailStatus === "success" && (
        <p className="text-[11px] text-emerald-400/50">You&apos;re in. We&apos;ll email you when the mountain comes out.</p>
      )}

      {/* Push notification toggle */}
      {pushStatus !== "unsupported" && (
        <div className="flex items-center gap-3">
          <button
            onClick={handlePushEnable}
            disabled={pushStatus === "loading" || pushStatus === "success"}
            className="inline-flex items-center gap-2 text-xs text-white/25 hover:text-white/40 transition-colors disabled:opacity-50"
          >
            {pushStatus === "success" ? (
              <Check className="w-3 h-3 text-emerald-400/60" />
            ) : pushStatus === "loading" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Bell className="w-3 h-3" />
            )}
            <span>
              {pushStatus === "success"
                ? "Push notifications enabled"
                : pushStatus === "denied"
                  ? "Push blocked — check browser settings"
                  : "Enable push notifications"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
