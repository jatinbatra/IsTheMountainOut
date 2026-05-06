export type Season = "spring" | "summer" | "fall" | "winter";

export interface SeasonalPalette {
  id: Season;
  label: string;
  statusVisible: string;
  statusHidden: string;
  sky: string;
  accent: string;
  accentSecondary: string;
  mountainBase: string;
  mountainSnow: string;
  water: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
}

const PALETTES: Record<Season, SeasonalPalette> = {
  spring: {
    id: "spring",
    label: "Spring",
    statusVisible: "PEAK EMERGING",
    statusHidden: "SPRING RAIN",
    sky: "#a8c8e8",
    accent: "#34d399",
    accentSecondary: "#a7f3d0",
    mountainBase: "#3a4a40",
    mountainSnow: "#d0ddd5",
    water: "#6B8EBF",
    bgPrimary: "#0f1a14",
    bgSecondary: "rgba(20, 35, 28, 0.85)",
    bgTertiary: "rgba(30, 50, 40, 0.7)",
    textPrimary: "#e8ece9",
    textSecondary: "#9aaa9f",
    textTertiary: "#5c6e63",
  },
  summer: {
    id: "summer",
    label: "Summer",
    statusVisible: "CLEAR PEAK",
    statusHidden: "SUMMER HAZE",
    sky: "#87CEEB",
    accent: "#4ade80",
    accentSecondary: "#6b9b4e",
    mountainBase: "#3a5a48",
    mountainSnow: "#d0ddd5",
    water: "#4A90E2",
    bgPrimary: "#0f1a14",
    bgSecondary: "rgba(20, 35, 28, 0.85)",
    bgTertiary: "rgba(30, 50, 40, 0.7)",
    textPrimary: "#e8ece9",
    textSecondary: "#9aaa9f",
    textTertiary: "#5c6e63",
  },
  fall: {
    id: "fall",
    label: "Fall",
    statusVisible: "GOLDEN HOUR",
    statusHidden: "AUTUMN CLOUDS",
    sky: "#c8956a",
    accent: "#f59e0b",
    accentSecondary: "#D4A574",
    mountainBase: "#3a3020",
    mountainSnow: "#c8c0b8",
    water: "#8B6A47",
    bgPrimary: "#0f1a14",
    bgSecondary: "rgba(25, 30, 22, 0.85)",
    bgTertiary: "rgba(40, 40, 30, 0.7)",
    textPrimary: "#e8ece9",
    textSecondary: "#9aaa9f",
    textTertiary: "#5c6e63",
  },
  winter: {
    id: "winter",
    label: "Winter",
    statusVisible: "POWDER CAP",
    statusHidden: "WINTER STORMS",
    sky: "#7a9ab8",
    accent: "#60a5fa",
    accentSecondary: "#8aa0b8",
    mountainBase: "#2a3a4a",
    mountainSnow: "#e0e8f0",
    water: "#4A5A7A",
    bgPrimary: "#0a1218",
    bgSecondary: "rgba(16, 24, 32, 0.85)",
    bgTertiary: "rgba(24, 36, 48, 0.7)",
    textPrimary: "#e0e4e8",
    textSecondary: "#8a9aa8",
    textTertiary: "#4a5a68",
  },
};

export function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

export function getSeasonalPalette(season?: Season): SeasonalPalette {
  return PALETTES[season ?? getCurrentSeason()];
}

export function getSeasonalStatusWord(season: Season, isVisible: boolean, isNight: boolean): string {
  const palette = PALETTES[season];
  if (isNight && isVisible) return "CLEAR TONIGHT";
  return isVisible ? palette.statusVisible : palette.statusHidden;
}

export function getCSSVariables(palette: SeasonalPalette): Record<string, string> {
  return {
    "--season-sky": palette.sky,
    "--season-accent": palette.accent,
    "--season-accent-secondary": palette.accentSecondary,
    "--season-mountain-base": palette.mountainBase,
    "--season-mountain-snow": palette.mountainSnow,
    "--season-water": palette.water,
    "--bg-primary": palette.bgPrimary,
    "--bg-secondary": palette.bgSecondary,
    "--bg-tertiary": palette.bgTertiary,
    "--text-primary": palette.textPrimary,
    "--text-secondary": palette.textSecondary,
    "--text-tertiary": palette.textTertiary,
  };
}
