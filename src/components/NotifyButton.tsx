"use client";

import { useState, useSyncExternalStore } from "react";
import { Bell, Check } from "lucide-react";
import {
  isNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerSW,
  subscribeToPush,
} from "@/lib/notifications";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const noopSubscribe = () => () => {};

export default function NotifyButton() {
  // Browser-only capabilities: the server snapshot is "unsupported" so SSR and
  // the first client render match (reading them during render caused a
  // hydration mismatch that made React re-render the whole page).
  const supported = useSyncExternalStore(noopSubscribe, isNotificationsSupported, () => false);
  const livePermission = useSyncExternalStore(noopSubscribe, getNotificationPermission, () => "unsupported");
  const [override, setOverride] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [failed, setFailed] = useState(false);
  const permission = override ?? livePermission;

  if (!VAPID_KEY) {
    return (
      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        Push alerts aren&apos;t switched on for this site yet.
      </p>
    );
  }
  if (!supported) return null;
  if (permission === "denied") {
    return (
      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
        Notifications are blocked in your browser settings.
      </p>
    );
  }

  if (permission === "granted" && !failed) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-medium text-[#6cae7e] border border-[#6cae7e]/30 bg-[#6cae7e]/10">
        <Check className="w-3.5 h-3.5" />
        <span>Notifications on</span>
      </div>
    );
  }

  const handleClick = async () => {
    setSubscribing(true);
    setFailed(false);
    const granted = await requestNotificationPermission();
    if (!granted) {
      setOverride("denied");
      setSubscribing(false);
      return;
    }
    const reg = await registerSW();
    const sub = reg ? await subscribeToPush(reg, VAPID_KEY) : null;
    setOverride("granted");
    setFailed(!sub);
    setSubscribing(false);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={subscribing}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-xs font-medium text-[color:var(--type-2)] border border-[var(--border-primary)] hover:bg-[var(--ink-deep)] hover:text-[color:var(--type-1)] transition-all disabled:opacity-50"
      >
        <Bell className="w-3.5 h-3.5" />
        <span>{subscribing ? "Enabling..." : "Notify me when it’s out"}</span>
      </button>
      {failed && (
        <p className="text-[11px]" style={{ color: "var(--accent-pink)" }}>
          Couldn&apos;t finish signing up for alerts. Please try again.
        </p>
      )}
    </div>
  );
}
