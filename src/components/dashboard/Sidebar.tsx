"use client";

import { Home, Eye, Map, BarChart3, Clock, Star, Info } from "lucide-react";

export const SIDEBAR_ITEMS = [
  { icon: Home,      label: "Home",      id: "home" },
  { icon: Eye,       label: "Views",     id: "viewpoints" },
  { icon: Map,       label: "Map",       id: "map" },
  { icon: BarChart3, label: "Forecast",  id: "forecast" },
  { icon: Clock,     label: "History",   id: "history" },
  { icon: Star,      label: "Favorites", id: "favorites" },
  { icon: Info,      label: "About",     id: "about" },
] as const;

interface SidebarProps {
  activeNav: string;
  onNavClick: (id: string) => void;
}

export default function Sidebar({ activeNav, onNavClick }: SidebarProps) {
  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sidebar-logo">
        <svg viewBox="0 0 36 36" className="w-8 h-8" aria-hidden="true">
          <polygon points="18,4 6,30 12,30 18,17 24,30 30,30" fill="var(--accent-gold)" opacity="0.75" />
          <polygon points="14,19 18,10 22,19 20,15 16,15" fill="white" opacity="0.4" />
          <line x1="4" y1="31" x2="32" y2="31" stroke="var(--accent-gold)" strokeWidth="0.8" opacity="0.25" />
          <polygon points="8,31 10,26 12,31" fill="var(--accent)" opacity="0.18" />
          <polygon points="26,31 28,27 30,31" fill="var(--accent)" opacity="0.18" />
        </svg>
      </div>

      <div className="sidebar-title">
        <div className="relative">
          <div className="sidebar-title-main">IS THE<br />MOUNTAIN<br />OUT?</div>
          <span className="absolute -top-1 -right-4 bg-[color:var(--accent)] text-white text-[7px] font-bold px-1 rounded-sm">V2</span>
        </div>
        <span className="sidebar-title-sub">MT. RAINIER · TRACKER</span>
      </div>

      <div className="sidebar-divider" />

      {SIDEBAR_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`sidebar-item ${activeNav === item.id ? "active" : ""}`}
          onClick={() => onNavClick(item.id)}
        >
          <item.icon className="w-[15px] h-[15px]" strokeWidth={1.6} />
          <span>{item.label}</span>
        </button>
      ))}

      <div className="sidebar-bottom">
        <span className="sidebar-calling">THE MOUNTAIN IS CALLING</span>
      </div>
    </nav>
  );
}
