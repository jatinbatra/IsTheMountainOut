/**
 * Central asset manifest — single source of truth for all image paths.
 *
 * Vector/procedural assets (ui, textures, maps) are shipped as production SVG
 * (scalable, tiny, crisp — the correct format for CSS layering and icons).
 *
 * Photographic assets (hero, viewpoints, mountain, atmosphere) must be real
 * Pacific-Northwest photography. Drop files at the exact paths below and they
 * are picked up automatically. Until supplied, code falls back to existing
 * local photos where available. See public/images/README.md.
 */

export const HERO = {
  clearPeak: "/images/hero/hero-clear-peak.jpg",
  springRain: "/images/hero/hero-spring-rain.jpg",
  foggyMorning: "/images/hero/hero-foggy-morning.jpg",
  winterBlueHour: "/images/hero/hero-winter-bluehour.jpg",
} as const;

export const VIEWPOINT_PHOTOS = {
  "kerry-park": "/images/viewpoints/kerry-park.jpg",
  "space-needle": "/images/viewpoints/space-needle.jpg",
  "gas-works": "/images/viewpoints/gas-works.jpg",
  bellevue: "/images/viewpoints/bellevue.jpg",
  "green-lake": "/images/viewpoints/green-lake.jpg",
  "snoqualmie-pass": "/images/viewpoints/snoqualmie-pass.jpg",
} as const;

export const RAINIER = {
  clearDay: "/images/mountain/rainier-clear-day.jpg",
  sunset: "/images/mountain/rainier-sunset.jpg",
  foggy: "/images/mountain/rainier-foggy.jpg",
  snow: "/images/mountain/rainier-snow.jpg",
} as const;

export const TEXTURES = {
  filmGrain: "/images/textures/film-grain.svg",
  fogOverlay: "/images/textures/fog-overlay.svg",
  vignette: "/images/textures/vignette.svg",
  cedar: "/images/textures/cedar-texture.jpg", // photographic — supply real file
} as const;

export const MAPS = {
  topoGreen: "/images/maps/topo-map-green.svg",
  topoDark: "/images/maps/topo-map-dark.svg",
} as const;

export const UI = {
  compass: "/images/ui/compass.svg",
  pnwBadge: "/images/ui/pnw-badge.svg",
  mountainIllustration: "/images/ui/mountain-illustration.svg",
} as const;

export const ATMOSPHERE = {
  fog: "/images/atmosphere/atmosphere-fog.jpg",
  sunRays: "/images/atmosphere/sun-rays.jpg",
} as const;

/** Map a seasonal/weather mood to its hero background. */
export function heroForMood(mood: "clear" | "rain" | "fog" | "winter"): string {
  switch (mood) {
    case "rain": return HERO.springRain;
    case "fog": return HERO.foggyMorning;
    case "winter": return HERO.winterBlueHour;
    default: return HERO.clearPeak;
  }
}
