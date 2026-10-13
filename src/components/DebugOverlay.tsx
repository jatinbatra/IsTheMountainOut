"use client";

import { useEffect, useState } from "react";

/**
 * Scroll diagnostics, shown only with ?debug=1. Read-only and
 * pointer-events:none so it can never interfere with scrolling itself.
 * ?debug=reset unregisters service workers and clears caches, then reloads.
 */

interface Info {
  build: string;
  sw: string;
  caches: string;
  ua: string;
  viewport: string;
  docHeight: number;
  scrollY: number;
  scroller: string;
  overflow: string;
  wheel: string;
  touch: string;
  wheelCount: number;
  touchCount: number;
  scrollCount: number;
}

function describe(el: EventTarget | null): string {
  if (!(el instanceof Element)) return "?";
  const cls = String(el.className || "").split(" ").filter(Boolean).slice(0, 2).join(".");
  return el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (cls ? `.${cls}` : "");
}

function ov(el: Element | null): string {
  if (!el) return "-";
  const cs = getComputedStyle(el);
  return `${cs.overflowX}/${cs.overflowY}${cs.touchAction !== "auto" ? ` ta:${cs.touchAction}` : ""}`;
}

export default function DebugOverlay({ mode }: { mode: string }) {
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    if (mode === "reset") {
      (async () => {
        const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
        await Promise.all(regs.map((r) => r.unregister()));
        const keys = (await caches?.keys?.()) ?? [];
        await Promise.all(keys.map((k) => caches.delete(k)));
        window.location.replace("/?debug=1");
      })();
      return;
    }

    const counts = { wheel: 0, touch: 0, scroll: 0 };
    let wheel = "none yet";
    let touch = "none yet";
    let cacheNames = "…";

    const snapshot = (): Info => ({
      build: document.documentElement.dataset.build || "unknown",
      sw: navigator.serviceWorker?.controller?.scriptURL?.replace(location.origin, "") ?? "none",
      caches: cacheNames,
      ua: navigator.userAgent.replace(/Mozilla\/5\.0 /, "").slice(0, 110),
      viewport: `${window.innerWidth}×${window.innerHeight} dpr ${window.devicePixelRatio}`,
      docHeight: document.documentElement.scrollHeight,
      scrollY: Math.round(window.scrollY),
      scroller: describe(document.scrollingElement),
      overflow: `html ${ov(document.documentElement)} · body ${ov(document.body)} · main ${ov(document.querySelector("main"))}`,
      wheel,
      touch,
      wheelCount: counts.wheel,
      touchCount: counts.touch,
      scrollCount: counts.scroll,
    });

    caches?.keys?.().then((k) => { cacheNames = k.join(", ") || "none"; }).catch(() => { cacheNames = "n/a"; });

    // Bubble-phase listeners on window run after page handlers, so
    // defaultPrevented tells us if something cancelled the gesture.
    const onWheel = (e: WheelEvent) => {
      counts.wheel++;
      wheel = `dy ${Math.round(e.deltaY)} on ${describe(e.target)}${e.defaultPrevented ? " ⚠ PREVENTED" : ""}`;
    };
    const onTouch = (e: TouchEvent) => {
      counts.touch++;
      touch = `${e.type} on ${describe(e.target)}${e.defaultPrevented ? " ⚠ PREVENTED" : ""}${e.cancelable ? "" : " (uncancelable)"}`;
    };
    const onScroll = () => { counts.scroll++; };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    const t = setInterval(() => setInfo(snapshot()), 250);
    return () => {
      clearInterval(t);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("scroll", onScroll);
    };
  }, [mode]);

  if (mode === "reset") return null;
  if (!info) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed", top: 8, left: 8, right: 8, zIndex: 9999, pointerEvents: "none",
        background: "rgba(0,0,0,0.82)", color: "#9effa0", font: "11px/1.45 ui-monospace, monospace",
        padding: "8px 10px", borderRadius: 8, whiteSpace: "pre-wrap", wordBreak: "break-all",
      }}
    >
      {`build ${info.build}
sw ${info.sw} | caches ${info.caches}
${info.ua}
viewport ${info.viewport} | doc ${info.docHeight}px
scrollY ${info.scrollY}  (scroll events ${info.scrollCount})
scroller ${info.scroller}
${info.overflow}
wheel ×${info.wheelCount}: ${info.wheel}
touch ×${info.touchCount}: ${info.touch}`}
    </div>
  );
}
