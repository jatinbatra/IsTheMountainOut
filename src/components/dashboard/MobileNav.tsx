"use client";

import { SIDEBAR_ITEMS } from "@/components/dashboard/Sidebar";

interface MobileNavProps {
  activeNav: string;
  onNavClick: (id: string) => void;
}

/**
 * Bottom tab bar for phones/tablets. The desktop <Sidebar> is display:none
 * below 1024px, so this is the only way to reach the sections on mobile.
 */
export default function MobileNav({ activeNav, onNavClick }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Main navigation">
      {SIDEBAR_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`mobile-nav-item ${activeNav === item.id ? "active" : ""}`}
          onClick={() => onNavClick(item.id)}
          aria-current={activeNav === item.id ? "page" : undefined}
        >
          <item.icon className="w-[18px] h-[18px]" strokeWidth={1.7} aria-hidden="true" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
