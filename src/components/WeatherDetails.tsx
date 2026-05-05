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
  quality: "good" | "moderate" | "poor";
  description: string;
}

function MiniProgress({ pct, quality }: { pct: number; quality: string }) {
  const color =
    quality === "good"
      ? "bg-[#2d8a4e]"
      : quality === "moderate"
        ? "bg-[#d4a843]"
        : "bg-[#c75a3a]";

  return (
    <div className="w-full h-1.5 rounded-full bg-[var(--ink-deep)] overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: `${Math.max(3, pct)}%` }}
      />
    </div>
  );
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
      quality: weather.cloudLow < 30 ? "good" : weather.cloudLow < 60 ? "moderate" : "poor",
      description: "Low clouds sit between you and the mountain — the #1 factor blocking views.",
    },
    {
      icon: Eye,
      label: "Atm. Visibility",
      value: `${visMiles} mi`,
      pct: Math.min(100, (weather.visibilityMeters / 1609.34 / 70) * 100),
      quality: Number(visMiles) > 40 ? "good" : Number(visMiles) > 20 ? "moderate" : "poor",
      description: "Rainier is ~56mi from Seattle. Need 40+ miles of atmospheric clarity.",
    },
    {
      icon: Droplets,
      label: "Humidity",
      value: `${weather.humidity}%`,
      pct: weather.humidity,
      quality: weather.humidity < 60 ? "good" : weather.humidity < 80 ? "moderate" : "poor",
      description: "High humidity creates haze that scatters light. Below 60% means crisp views.",
    },
    {
      icon: Thermometer,
      label: "Temperature",
      value: `${tempF}°F`,
      detail: `${weather.temperature.toFixed(1)}°C`,
      pct: Math.min(100, (weather.temperature / 40) * 100),
      quality: "moderate",
      description: "Temperature inversions trap haze at low levels, reducing clarity.",
    },
    {
      icon: Wind,
      label: "Wind",
      value: `${weather.windSpeed.toFixed(0)} km/h`,
      pct: Math.min(100, (weather.windSpeed / 60) * 100),
      quality: weather.windSpeed > 10 && weather.windSpeed < 40 ? "good" : "moderate",
      description: "Moderate wind clears haze. Too strong brings storms.",
    },
    ...(weather.pm25 !== undefined
      ? [
          {
            icon: Leaf as LucideIcon,
            label: "PM2.5 (Air Quality)",
            value: `${weather.pm25.toFixed(1)} µg/m³`,
            detail: weather.pm25 <= 12 ? "Good" : weather.pm25 <= 35 ? "Moderate" : "Unhealthy",
            pct: Math.min(100, (weather.pm25 / 50) * 100),
            quality: (weather.pm25 <= 12 ? "good" : weather.pm25 <= 35 ? "moderate" : "poor") as "good" | "moderate" | "poor",
            description: "Fine particles scatter light. Wildfire smoke can hide Rainier for weeks.",
          },
        ]
      : []),
  ];

  return (
    <div className="alpine-card-lg space-y-5">
      <div>
        <h2 className="font-display text-lg font-medium text-[color:var(--type-1)]">
          Conditions
        </h2>
        <p className="text-xs text-[color:var(--type-3)] mt-0.5">What&apos;s affecting visibility</p>
      </div>

      <div className="space-y-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--ink-deep)] flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-[color:var(--type-3)]" />
                  </div>
                  <div>
                    <span className="text-sm text-[color:var(--type-1)]">{stat.label}</span>
                    {stat.detail && (
                      <span className="text-[10px] text-[color:var(--type-4)] ml-2">{stat.detail}</span>
                    )}
                  </div>
                </div>
                <span className="font-mono text-sm font-medium text-[color:var(--type-1)] tabular">{stat.value}</span>
              </div>
              <div className="ml-9">
                <MiniProgress pct={stat.pct} quality={stat.quality} />
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 text-xs text-[color:var(--accent)] font-medium hover:text-[color:var(--type-1)] transition-colors"
        >
          <span>Why this score?</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
        </button>

        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
          expanded ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"
        }`}>
          <ul className="space-y-2 mb-4">
            {reasons.map((reason, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-[color:var(--type-3)] leading-relaxed"
              >
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[color:var(--accent)] shrink-0" />
                {reason}
              </li>
            ))}
          </ul>

          <div className="space-y-1.5 p-3 rounded bg-[var(--ink-deep)]">
            {stats.map((stat) => (
              <p key={stat.label} className="text-[11px] text-[color:var(--type-3)] leading-relaxed">
                <span className="font-medium text-[color:var(--type-2)]">{stat.label}:</span> {stat.description}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
