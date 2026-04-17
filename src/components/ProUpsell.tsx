"use client";

import { useState } from "react";
import { X, Crown, Zap, Sparkles, Loader2, Check } from "lucide-react";
import { setLocalPro, getHandle, setHandle as saveHandle } from "@/lib/identity";
import { usePro } from "@/hooks/usePro";

interface Props {
  open: boolean;
  onClose: () => void;
  onUpgraded?: () => void;
}

export default function ProUpsell({ open, onClose, onUpgraded }: Props) {
  const { userId, active, plan, expiresAt } = usePro();
  const [selected, setSelected] = useState<"monthly" | "annual">("annual");
  const [handleInput, setHandleInput] = useState(() => getHandle());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const startCheckout = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/pro/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan: selected }),
      });
      const data: { url?: string; mode?: string } = await res.json();
      if (!data.url) throw new Error("no_url");

      if (data.mode === "mock") {
        const grant = await fetch("/api/pro/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, plan: selected, handle: handleInput }),
        });
        if (!grant.ok) throw new Error("grant_failed");
        const expires = new Date();
        if (selected === "annual") expires.setFullYear(expires.getFullYear() + 1);
        else expires.setMonth(expires.getMonth() + 1);
        setLocalPro({ active: true, plan: selected, expiresAt: expires.toISOString() });
        if (handleInput) saveHandle(handleInput);
        setDone(true);
        setTimeout(() => {
          onUpgraded?.();
          onClose();
          setDone(false);
        }, 1400);
      } else {
        if (handleInput) saveHandle(handleInput);
        window.location.href = data.url;
      }
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-black/75 backdrop-blur-xl animate-fade-up"
      />
      <div className="relative w-full sm:max-w-md mx-auto sm:mx-4 rounded-t-3xl sm:rounded-3xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 ring-1 ring-white/10 shadow-2xl p-6 animate-fade-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg glass hover:bg-white/[0.08] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-white/50" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400/30 to-amber-600/20 ring-1 ring-amber-400/40">
            <Crown className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Mountain Pro</h3>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">
              PNW-priced · Cancel anytime
            </p>
          </div>
        </div>

        {active ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/25">
              <Check className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-display font-bold text-emerald-200">You&apos;re Pro</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {plan === "annual" ? "Annual plan" : "Monthly plan"}
                  {expiresAt
                    ? ` · renews ${new Date(expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>12-hour advance alpenglow alerts active</span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>Watermark hidden on Mountain Moment cards</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ul className="space-y-2.5 mb-5">
              {[
                { icon: Zap, text: "12-hour advance alpenglow alerts" },
                { icon: Sparkles, text: "AI photo verification — prove you saw it" },
                { icon: Crown, text: "Custom handle on Hood Wars + Pool" },
                { icon: Check, text: "Watermark-free Mountain Moment cards" },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/75">
                  <div className="flex-shrink-0 p-1.5 rounded-lg bg-amber-500/10 ring-1 ring-amber-400/20 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {(["monthly", "annual"] as const).map((p) => {
                const active = selected === p;
                const label = p === "annual" ? "Annual" : "Monthly";
                const price = p === "annual" ? "$24" : "$3.99";
                const sub = p === "annual" ? "/year · save 50%" : "/month";
                return (
                  <button
                    key={p}
                    onClick={() => setSelected(p)}
                    className={`relative text-left p-4 rounded-2xl transition-all ${
                      active
                        ? "bg-gradient-to-br from-amber-500/20 to-amber-400/10 ring-1 ring-amber-400/40"
                        : "bg-white/[0.04] ring-1 ring-white/[0.08] hover:bg-white/[0.07]"
                    }`}
                  >
                    {p === "annual" && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/30">
                        Best
                      </span>
                    )}
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
                    <div className="mt-1 flex items-baseline gap-0.5">
                      <span className="font-display text-2xl font-bold text-white">{price}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
                  </button>
                );
              })}
            </div>

            <label className="block text-[11px] text-slate-500 font-medium tracking-wide uppercase mb-1.5">
              Handle (optional)
            </label>
            <input
              type="text"
              placeholder="@yourname"
              value={handleInput}
              onChange={(e) => setHandleInput(e.target.value.slice(0, 24))}
              className="w-full mb-5 px-3.5 py-2.5 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-amber-400/40"
              maxLength={24}
            />

            <button
              onClick={startCheckout}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-display font-bold text-sm text-white bg-gradient-to-r from-amber-500/90 via-amber-400/90 to-orange-400/90 ring-1 ring-amber-300/50 shadow-lg shadow-amber-500/20 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Opening checkout…
                </>
              ) : done ? (
                <>
                  <Check className="w-4 h-4" />
                  You&apos;re in
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  Go Pro — {selected === "annual" ? "$24/yr" : "$3.99/mo"}
                </>
              )}
            </button>

            <p className="mt-3 text-center text-[11px] text-slate-500 leading-relaxed">
              No ads ever. Pro keeps the app independent and Seattle-grown.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
