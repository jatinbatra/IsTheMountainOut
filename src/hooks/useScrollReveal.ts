"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * React-state-driven scroll reveal. Returns a ref to attach to the container
 * and a Set of revealed element indices. Avoids direct DOM classList mutation.
 */
export function useScrollReveal(itemCount: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const newRevealed = new Set<number>();
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.revealIndex);
            if (!isNaN(idx)) newRevealed.add(idx);
          }
        });
        if (newRevealed.size > 0) {
          setRevealed((prev) => {
            const merged = new Set(prev);
            newRevealed.forEach((i) => merged.add(i));
            return merged;
          });
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const els = containerRef.current.querySelectorAll("[data-reveal-index]");
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [itemCount]);

  const isRevealed = useCallback(
    (index: number) => revealed.has(index),
    [revealed]
  );

  return { containerRef, isRevealed };
}
