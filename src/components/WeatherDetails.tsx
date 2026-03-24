"use client";

import { useState } from "react";
import {
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  Eye,
  Leaf,
  ChevronDown,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface WeatherInfo {
  temperature: number;
  humidity: number;
  windSpeed: number;
  cloudLow: number;
  cloudMid: number;
  cloudHigh: number;
  visibilityMeters: number;
  pm25?: number;
}

interface Props {
  weather: WeatherInfo;
  reasons: string[];
}

interface StatInfo {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  expandedContent?: {
    description: string;
    impact: string;
    threshold: string;
    gauge?: { value: number; max: number; unit: string };
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  expandedContent,
  isExpanded,
  onToggle,
}: StatInfo & { isExpanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left rounded-2xl p-4 transition-all duration-300 ${
        isExpanded
          ? "glass-strong ring-1 ring-white/10 col-span-2 sm:col-span-1"
          : "glass glass-hover"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${accent || "bg-blue-500/10"}`}>
            <Icon className="w-3.5 h-3.5 text-white/60" />
          </div>
          <span className="text-xs text-white/35 font-medium">{label}</span>
        </div>
        {expandedContent && (
          <ChevronDown
            className={`w-3 h-3 text-white/20 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        )}
      </div>
      <div className="font-display text-xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-white/25 mt-1">{sub}</div>}

      {/* Expanded detail */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded && expandedContent ? "max-h-48 opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
      >
        {expandedContent && (
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <p className="text-xs text-white/40 leading-relaxed">
              {expandedContent.description}
            </p>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-white/25">Impact:</span>
              <span className="text-white/50 font-medium">{expandedContent.impact}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-white/25">Ideal:</span>
              <span className="text-white/50 font-medium">{expandedContent.threshold}</span>
            </div>
            {expandedContent.gauge && (
              <div className="pt-1">
                <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400/70 via-amber-400/70 to-red-400/70 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (expandedContent.gauge.value / expandedContent.gauge.max) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-white/15 mt-0.5">
                  <span>0</span>
                  <span>{expandedContent.gauge.max} {expandedContent.gauge.unit}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

export default function WeatherDetails({ weather, reasons }: Props) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const visMiles = (weather.visibilityMeters / 1609.34).toFixed(1);
  const tempF = ((weather.temperature * 9) / 5 + 32).toFixed(0);

  const toggleCard = (label: string) => {
    setExpandedCard(expandedCard === label ? null : label);
  };

  const stats: StatInfo[] = [
    {
      icon: Thermometer,
      label: "Temperature",
      value: `${tempF}°F`,
      sub: `${weather.temperature.toFixed(1)}°C`,
      accent: "bg-orange-500/10",
      expandedContent: {
        description:
          "Temperature inversions can trap haze at low levels, reducing mountain visibility even on cloudless days.",
        impact: "Moderate - affects haze formation",
        threshold: "Cool, dry air is best for clear views",
        gauge: {
          value: weather.temperature,
          max: 40,
          unit: "°C",
        },
      },
    },
    {
      icon: Droplets,
      label: "Humidity",
      value: `${weather.humidity}%`,
      accent: "bg-cyan-500/10",
      expandedContent: {
        description:
          "High humidity creates haze particles that scatter light. Below 60% typically means crisp mountain views.",
        impact: "High - humidity creates atmospheric haze",
        threshold: "Below 60% for best visibility",
        gauge: { value: weather.humidity, max: 100, unit: "%" },
      },
    },
    {
      icon: Wind,
      label: "Wind",
      value: `${weather.windSpeed.toFixed(0)} km/h`,
      accent: "bg-sky-500/10",
      expandedContent: {
        description:
          "Light winds let haze settle; moderate winds clear it out. Strong winds can create a crisp view but may bring clouds.",
        impact: "Moderate - clears or brings weather",
        threshold: "10-25 km/h clears haze without bringing storms",
        gauge: { value: weather.windSpeed, max: 60, unit: "km/h" },
      },
    },
    {
      icon: Eye,
      label: "Visibility",
      value: `${visMiles} mi`,
      accent: "bg-violet-500/10",
      expandedContent: {
        description:
          "Mt. Rainier is ~56 miles from Seattle. You need at least 40+ miles of atmospheric visibility to see it clearly.",
        impact: "Critical - must be able to see 56 miles",
        threshold: "40+ miles for clear views, 56+ for sharp detail",
        gauge: {
          value: weather.visibilityMeters / 1609.34,
          max: 70,
          unit: "mi",
        },
      },
    },
    {
      icon: Cloud,
      label: "Low Clouds",
      value: `${weather.cloudLow}%`,
      sub: `Mid: ${weather.cloudMid}% · High: ${weather.cloudHigh}%`,
      accent: "bg-slate-500/10",
      expandedContent: {
        description:
          "Low clouds (0-2km altitude) are the #1 factor. They sit right between you and the mountain. Even 30% low cloud cover can block the view.",
        impact: "Critical - biggest single factor (40% of score)",
        threshold: "Below 20% for reliable views",
        gauge: { value: weather.cloudLow, max: 100, unit: "%" },
      },
    },
    ...(weather.pm25 !== undefined
      ? [
          {
            icon: Leaf as LucideIcon,
            label: "Air Quality",
            value: `${weather.pm25.toFixed(1)}`,
            sub:
              weather.pm25 <= 12
                ? "Good (PM2.5 µg/m³)"
                : weather.pm25 <= 35
                  ? "Moderate (PM2.5 µg/m³)"
                  : "Unhealthy (PM2.5 µg/m³)",
            accent:
              weather.pm25 <= 12
                ? "bg-emerald-500/10"
                : weather.pm25 <= 35
                  ? "bg-amber-500/10"
                  : "bg-red-500/10",
            expandedContent: {
              description:
                "Fine particulate matter (PM2.5) scatters light and creates a milky haze. Wildfire smoke in summer can completely hide Rainier for weeks.",
              impact: "Moderate - especially in wildfire season",
              threshold: "Below 12 µg/m³ for clean air",
              gauge: {
                value: weather.pm25,
                max: 50,
                unit: "µg/m³",
              },
            },
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-white">
          Current Conditions
        </h2>
        <span className="text-[10px] text-white/15 font-medium">
          Tap cards for details
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            {...stat}
            isExpanded={expandedCard === stat.label}
            onToggle={() => toggleCard(stat.label)}
          />
        ))}
      </div>

      {/* Analysis reasons */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-display text-sm font-semibold text-white/50 mb-4 tracking-wide uppercase">
          Visibility Analysis
        </h3>
        <ul className="space-y-3">
          {reasons.map((reason, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-white/60 leading-relaxed"
            >
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400/50 shrink-0 ring-2 ring-blue-400/15" />
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
