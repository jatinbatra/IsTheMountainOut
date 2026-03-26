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

interface StatRow {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
  pct: number;
  color: string;
  description: string;
}

export default function WeatherDetails({ weather, reasons }: Props) {
  const [expanded, setExpanded] = useState(false);

  const visMiles = (weather.visibilityMeters / 1609.34).toFixed(1);
  const tempF = ((weather.temperature * 9) / 5 + 32).toFixed(0);

  const stats: StatRow[] = [
    {
      icon: Cloud,
      label: "Low Clouds",
      value: `${weather.cloudLow}%`,
      detail: `Mid ${weather.cloudMid}% · High ${weather.cloudHigh}%`,
      pct: weather.cloudLow,
      color: weather.cloudLow < 30 ? "bg-emerald-400/60" : weather.cloudLow < 60 ? "bg-amber-400/60" : "bg-red-400/60",
      description: "Low clouds sit between you and the mountain — the #1 factor blocking views.",
    },
    {
      icon: Eye,
      label: "Visibility",
      value: `${visMiles} mi`,
      pct: Math.min(100, (weather.visibilityMeters / 1609.34 / 70) * 100),
      color: Number(visMiles) > 40 ? "bg-emerald-400/60" : Number(visMiles) > 20 ? "bg-amber-400/60" : "bg-red-400/60",
      description: "Rainier is ~56mi from Seattle. Need 40+ miles of atmospheric clarity.",
    },
    {
      icon: Droplets,
      label: "Humidity",
      value: `${weather.humidity}%`,
      pct: weather.humidity,
      color: weather.humidity < 60 ? "bg-emerald-400/60" : weather.humidity < 80 ? "bg-amber-400/60" : "bg-red-400/60",
      description: "High humidity creates haze that scatters light. Below 60% means crisp views.",
    },
    {
      icon: Thermometer,
      label: "Temperature",
      value: `${tempF}°F`,
      detail: `${weather.temperature.toFixed(1)}°C`,
      pct: Math.min(100, (weather.temperature / 40) * 100),
      color: "bg-orange-400/50",
      description: "Temperature inversions trap haze at low levels, reducing clarity.",
    },
    {
      icon: Wind,
      label: "Wind",
      value: `${weather.windSpeed.toFixed(0)} km/h`,
      pct: Math.min(100, (weather.windSpeed / 60) * 100),
      color: "bg-sky-400/50",
      description: "Moderate wind clears haze. Too strong brings storms.",
    },
    ...(weather.pm25 !== undefined
      ? [
          {
            icon: Leaf as LucideIcon,
            label: "PM2.5",
            value: `${weather.pm25.toFixed(1)}`,
            detail: weather.pm25 <= 12 ? "Good" : weather.pm25 <= 35 ? "Moderate" : "Unhealthy",
            pct: Math.min(100, (weather.pm25 / 50) * 100),
            color: weather.pm25 <= 12 ? "bg-emerald-400/60" : weather.pm25 <= 35 ? "bg-amber-400/60" : "bg-red-400/60",
            description: "Fine particles scatter light. Wildfire smoke can hide Rainier for weeks.",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-white">
        Conditions
      </h2>

      {/* Stat rows — no cards, just clean lines */}
      <div className="space-y-0">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="group py-3 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3 h-3 text-white/20" />
                  <span className="text-xs text-white/35 font-medium">{stat.label}</span>
                  {stat.detail && (
                    <span className="text-[10px] text-white/15">{stat.detail}</span>
                  )}
                </div>
                <span className="font-display text-sm font-bold text-white">{stat.value}</span>
              </div>
              <div className="w-full h-[2px] rounded-full bg-white/[0.04] ml-5">
                <div
                  className={`h-full rounded-full ${stat.color} transition-all duration-700`}
                  style={{ width: `${stat.pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analysis — expandable, no box */}
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-2 text-xs text-white/20 hover:text-white/35 transition-colors font-medium"
        >
          <span>Why this score?</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
        </button>

        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
          expanded ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}>
          <ul className="space-y-2.5">
            {reasons.map((reason, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs text-white/40 leading-relaxed"
              >
                <span className="mt-1.5 w-1 h-1 rounded-full bg-white/15 shrink-0" />
                {reason}
              </li>
            ))}
          </ul>

          {/* Expanded stat descriptions */}
          <div className="mt-5 space-y-2">
            {stats.map((stat) => (
              <p key={stat.label} className="text-[10px] text-white/15 leading-relaxed">
                <span className="text-white/25 font-medium">{stat.label}:</span> {stat.description}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
