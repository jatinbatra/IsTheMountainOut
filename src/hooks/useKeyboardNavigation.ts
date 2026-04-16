"use client";

import { useEffect, useCallback } from "react";

/**
 * Keyboard navigation for a list of items.
 * Arrow Up/Down and j/k move selection within bounds.
 */
export function useKeyboardNavigation(
  itemCount: number,
  selectedIndex: number,
  onSelect: (index: number) => void
) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (itemCount === 0) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        onSelect(Math.min(selectedIndex + 1, itemCount - 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        onSelect(Math.max(selectedIndex - 1, 0));
      }
    },
    [itemCount, selectedIndex, onSelect]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);
}
