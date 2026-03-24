"use client";

import {
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  Eye,
  Leaf,
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

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="glass glass-hover rounded-2xl p-4 group">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`p-1.5 rounded-lg ${accent || "bg-blue-500/10"}`}>
          <Icon className="w-3.5 h-3.5 text-white/60" />
        </div>
        <span className="text-xs text-white/35 font-medium">{label}</span>
      </div>
      <div className="font-display text-xl font-bold text-white">{value}</div>
      {sub && (
        <div className="text-xs text-white/25 mt-1">{sub}</div>
      )}
    </div>
  );
}

export default function WeatherDetails({ weather, reasons }: Props) {
  const visMiles = (weather.visibilityMeters / 1609.34).toFixed(1);
  const tempF = ((weather.temperature * 9) / 5 + 32).toFixed(0);

  const stats = [
    {
      icon: Thermometer,
      label: "Temperature",
      value: `${tempF}°F`,
      sub: `${weather.temperature.toFixed(1)}°C`,
      accent: "bg-orange-500/10",
    },
    {
      icon: Droplets,
      label: "Humidity",
      value: `${weather.humidity}%`,
      accent: "bg-cyan-500/10",
    },
    {
      icon: Wind,
      label: "Wind",
      value: `${weather.windSpeed.toFixed(0)} km/h`,
      accent: "bg-sky-500/10",
    },
    {
      icon: Eye,
      label: "Visibility",
      value: `${visMiles} mi`,
      accent: "bg-violet-500/10",
    },
    {
      icon: Cloud,
      label: "Low Clouds",
      value: `${weather.cloudLow}%`,
      sub: `Mid: ${weather.cloudMid}% · High: ${weather.cloudHigh}%`,
      accent: "bg-slate-500/10",
    },
    ...(weather.pm25 !== undefined
      ? [
          {
            icon: Leaf,
            label: "Air Quality",
            value: `${weather.pm25.toFixed(1)}`,
            sub:
              weather.pm25 <= 12
                ? "Good — PM2.5 µg/m³"
                : weather.pm25 <= 35
                  ? "Moderate — PM2.5 µg/m³"
                  : "Unhealthy — PM2.5 µg/m³",
            accent: weather.pm25 <= 12 ? "bg-emerald-500/10" : weather.pm25 <= 35 ? "bg-amber-500/10" : "bg-red-500/10",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-white">Current Conditions</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
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
