"use client";

import {
  Thermometer,
  Droplets,
  Wind,
  Cloud,
  Eye,
  Leaf,
} from "lucide-react";

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

export default function WeatherDetails({ weather, reasons }: Props) {
  const visMiles = (weather.visibilityMeters / 1609.34).toFixed(1);
  const tempF = ((weather.temperature * 9) / 5 + 32).toFixed(0);

  const stats = [
    {
      icon: Thermometer,
      label: "Temperature",
      value: `${tempF}°F`,
      sub: `${weather.temperature.toFixed(1)}°C`,
    },
    {
      icon: Droplets,
      label: "Humidity",
      value: `${weather.humidity}%`,
    },
    {
      icon: Wind,
      label: "Wind Speed",
      value: `${weather.windSpeed.toFixed(0)} km/h`,
    },
    {
      icon: Eye,
      label: "Visibility",
      value: `${visMiles} mi`,
    },
    {
      icon: Cloud,
      label: "Low Clouds",
      value: `${weather.cloudLow}%`,
      sub: `Mid: ${weather.cloudMid}% · High: ${weather.cloudHigh}%`,
    },
    ...(weather.pm25 !== undefined
      ? [
          {
            icon: Leaf,
            label: "Air Quality (PM2.5)",
            value: `${weather.pm25.toFixed(1)} µg/m³`,
            sub:
              weather.pm25 <= 12
                ? "Good"
                : weather.pm25 <= 35
                  ? "Moderate"
                  : "Unhealthy",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Current Conditions</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white/5 rounded-xl p-4 border border-white/5"
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="w-4 h-4 text-white/40" />
              <span className="text-xs text-white/40">{stat.label}</span>
            </div>
            <div className="text-lg font-semibold text-white">{stat.value}</div>
            {stat.sub && (
              <div className="text-xs text-white/30 mt-0.5">{stat.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Analysis reasons */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/5">
        <h3 className="text-sm font-medium text-white/60 mb-3">
          Visibility Analysis
        </h3>
        <ul className="space-y-2">
          {reasons.map((reason, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-white/70"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400/60 shrink-0" />
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
