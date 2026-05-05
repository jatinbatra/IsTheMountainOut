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
    accent: "#9D4E6C",
    accentSecondary: "#c7a0b0",
    mountainBase: "#8a7060",
    mountainSnow: "#f5e8e0",
    water: "#6B8EBF",
    bgPrimary: "#faf8f5",
    bgSecondary: "#f5f2ef",
    bgTertiary: "#ede8e4",
    textPrimary: "#2a2520",
    textSecondary: "#5c554e",
    textTertiary: "#8a8380",
  },
  summer: {
    id: "summer",
    label: "Summer",
    statusVisible: "CLEAR PEAK",
    statusHidden: "SUMMER HAZE",
    sky: "#87CEEB",
    accent: "#2d5016",
    accentSecondary: "#6b9b4e",
    mountainBase: "#7a6b55",
    mountainSnow: "#f8f8f5",
    water: "#4A90E2",
    bgPrimary: "#f9f7f4",
    bgSecondary: "#f3f0ec",
    bgTertiary: "#ebe7e2",
    textPrimary: "#1a1a1a",
    textSecondary: "#4a4a4a",
    textTertiary: "#8a8a8a",
  },
  fall: {
    id: "fall",
    label: "Fall",
    statusVisible: "GOLDEN HOUR",
    statusHidden: "AUTUMN CLOUDS",
    sky: "#c8956a",
    accent: "#6B4423",
    accentSecondary: "#D4A574",
    mountainBase: "#5c4020",
    mountainSnow: "#e8e0d8",
    water: "#8B6A47",
    bgPrimary: "#faf6f1",
    bgSecondary: "#f4efe8",
    bgTertiary: "#ece5dc",
    textPrimary: "#2a1f14",
    textSecondary: "#5c4a3a",
    textTertiary: "#8a7a6a",
  },
  winter: {
    id: "winter",
    label: "Winter",
    statusVisible: "POWDER CAP",
    statusHidden: "WINTER STORMS",
    sky: "#7a9ab8",
    accent: "#3A4A5A",
    accentSecondary: "#8aa0b8",
    mountainBase: "#4a4a5a",
    mountainSnow: "#ffffff",
    water: "#4A5A7A",
    bgPrimary: "#f5f6f8",
    bgSecondary: "#eef0f3",
    bgTertiary: "#e4e7ec",
    textPrimary: "#1a1a20",
    textSecondary: "#4a4a55",
    textTertiary: "#7a7a88",
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
