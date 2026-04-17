"use client";

import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import {
  isNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerSW,
  subscribeToPush,
} from "@/lib/notifications";

export default function NotifyButton() {
  const [permission, setPermission] = useState<string>("default");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const p = getNotificationPermission();
    setPermission(p);
  }, []);

  if (!isNotificationsSupported()) return null;
  if (permission === "denied") return null;

  if (permission === "granted") {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-emerald-400/70 ring-1 ring-emerald-400/15 bg-emerald-500/5">
        <Check className="w-3.5 h-3.5" />
        <span>Notifications on</span>
      </div>
    );
  }

  const handleClick = async () => {
    setSubscribing(true);
    const granted = await requestNotificationPermission();
    if (granted) {
      setPermission("granted");
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidKey) {
        const reg = await registerSW();
        if (reg) {
          await subscribeToPush(reg, vapidKey);
        }
      }
    } else {
      setPermission("denied");
    }
    setSubscribing(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={subscribing}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-white/50 ring-1 ring-white/[0.08] hover:bg-white/[0.06] hover:text-white/70 transition-all disabled:opacity-50"
    >
      <Bell className="w-3.5 h-3.5" />
      <span>{subscribing ? "Enabling..." : "Notify me when it\u2019s out"}</span>
    </button>
  );
}
