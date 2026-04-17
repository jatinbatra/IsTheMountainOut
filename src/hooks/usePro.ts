"use client";

import { useEffect, useState } from "react";
import { getLocalPro, getUserId, setLocalPro, type LocalPro } from "@/lib/identity";

export function usePro(): LocalPro & { loading: boolean; userId: string } {
  const [state, setState] = useState<LocalPro>({ active: false, plan: null, expiresAt: null });
  const [loading, setLoading] = useState(true);
  const [userId, setUid] = useState("ssr");

  useEffect(() => {
    let cancelled = false;
    const uid = getUserId();
    const local = getLocalPro();
    queueMicrotask(() => {
      if (cancelled) return;
      setUid(uid);
      setState(local);
    });

    fetch(`/api/pro/status?userId=${encodeURIComponent(uid)}`)
      .then((r) => r.json())
      .then((data: { pro: boolean; entitlement?: { plan: string; expiresAt: string | null } }) => {
        if (data.pro && data.entitlement) {
          const plan = data.entitlement.plan === "annual" ? "annual" : data.entitlement.plan === "lifetime" ? "lifetime" : "monthly";
          const next: LocalPro = {
            active: true,
            plan,
            expiresAt: data.entitlement.expiresAt,
          };
          setState(next);
          setLocalPro(next);
        } else {
          setState({ active: false, plan: null, expiresAt: null });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...state, loading, userId };
}
