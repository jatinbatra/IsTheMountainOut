import { WeatherData } from "./weather";

export interface SkyTheme {
  skyGradient: string;
  mountainFill: string;
  snowFill: string;
  cloudOpacity: number;
  sunMoonColor: string;
  showSun: boolean;
  showMoon: boolean;
  showStars: boolean;
  glowColor: string;
  fogOpacity: number;
  label: string;
}

/**
 * Determine the sky visual theme based on real weather data.
 * Creates gradients and colors that simulate current conditions.
 */
export function getSkyTheme(weather: WeatherData): SkyTheme {
  const now = new Date();
  const hour = now.getHours();
  const isDay = weather.isDay;

  // Parse sunrise/sunset times
  const sunriseHour = weather.sunrise
    ? new Date(weather.sunrise).getHours()
    : 6;
  const sunsetHour = weather.sunset
    ? new Date(weather.sunset).getHours()
    : 18;

  const isGoldenHour =
    (hour >= sunriseHour && hour < sunriseHour + 1) ||
    (hour >= sunsetHour - 1 && hour <= sunsetHour);
  const isTwilight =
    (hour >= sunsetHour && hour < sunsetHour + 1) ||
    (hour >= sunriseHour - 1 && hour < sunriseHour);

  // Weather code interpretation
  const isRaining =
    (weather.weatherCode >= 51 && weather.weatherCode <= 67) ||
    (weather.weatherCode >= 80 && weather.weatherCode <= 82);
  const isSnowing =
    weather.weatherCode >= 71 && weather.weatherCode <= 77;
  const isFoggy =
    weather.weatherCode >= 45 && weather.weatherCode <= 48;
  const isOvercast = weather.currentCloudLow > 70;
  const isPartlyCloudy =
    weather.currentCloudLow > 30 && weather.currentCloudLow <= 70;

  // Fog layer opacity
  const fogOpacity = isFoggy
    ? 0.6
    : weather.visibility < 10000
      ? 0.3
      : 0;

  // Cloud overlay opacity from total cloud cover
  const totalCloud =
    weather.currentCloudLow * 0.5 +
    weather.currentCloudMid * 0.3 +
    weather.currentCloudHigh * 0.2;
  const cloudOpacity = totalCloud / 100;

  // Night time
  if (!isDay && !isTwilight) {
    return {
      skyGradient: "linear-gradient(180deg, #0a0a2e 0%, #1a1a3e 40%, #2a2a4e 100%)",
      mountainFill: "#1a1a2e",
      snowFill: "#c0c0d0",
      cloudOpacity: cloudOpacity * 0.4,
      sunMoonColor: "#f0e68c",
      showSun: false,
      showMoon: true,
      showStars: cloudOpacity < 0.5,
      glowColor: "rgba(240, 230, 140, 0.15)",
      fogOpacity,
      label: isOvercast ? "Overcast night" : "Clear night sky",
    };
  }

  // Golden hour
  if (isGoldenHour) {
    return {
      skyGradient: isOvercast
        ? "linear-gradient(180deg, #8B6914 0%, #B8860B 30%, #CD853F 60%, #D2B48C 100%)"
        : "linear-gradient(180deg, #FF6B35 0%, #FF8C42 25%, #FFB347 50%, #FFD700 75%, #87CEEB 100%)",
      mountainFill: isOvercast ? "#3a3020" : "#2d1b4e",
      snowFill: isOvercast ? "#c0a870" : "#ffcce0",
      cloudOpacity: cloudOpacity * 0.5,
      sunMoonColor: "#FF6B35",
      showSun: true,
      showMoon: false,
      showStars: false,
      glowColor: "rgba(255, 107, 53, 0.3)",
      fogOpacity,
      label: "Golden hour",
    };
  }

  // Twilight
  if (isTwilight) {
    return {
      skyGradient:
        "linear-gradient(180deg, #1a1a4e 0%, #4a3080 30%, #c06070 60%, #e0a060 100%)",
      mountainFill: "#1a1a3e",
      snowFill: "#d0b0c0",
      cloudOpacity: cloudOpacity * 0.5,
      sunMoonColor: "#e0a060",
      showSun: false,
      showMoon: false,
      showStars: cloudOpacity < 0.3,
      glowColor: "rgba(192, 96, 112, 0.2)",
      fogOpacity,
      label: "Twilight",
    };
  }

  // Rainy day
  if (isRaining || isSnowing) {
    return {
      skyGradient:
        "linear-gradient(180deg, #4a4a5a 0%, #6a6a7a 40%, #8a8a9a 70%, #a0a0b0 100%)",
      mountainFill: "#3a3a4a",
      snowFill: "#b0b0c0",
      cloudOpacity: 0.8,
      sunMoonColor: "#aaa",
      showSun: false,
      showMoon: false,
      showStars: false,
      glowColor: "rgba(100, 100, 120, 0.2)",
      fogOpacity: 0.3,
      label: isRaining ? "Rainy" : "Snowy",
    };
  }

  // Foggy
  if (isFoggy) {
    return {
      skyGradient:
        "linear-gradient(180deg, #b0b8c8 0%, #c8d0d8 40%, #d8dce0 100%)",
      mountainFill: "#8090a0",
      snowFill: "#d0d8e0",
      cloudOpacity: 0.6,
      sunMoonColor: "#ddd",
      showSun: false,
      showMoon: false,
      showStars: false,
      glowColor: "rgba(180, 190, 200, 0.3)",
      fogOpacity: 0.7,
      label: "Foggy",
    };
  }

  // Overcast day
  if (isOvercast) {
    return {
      skyGradient:
        "linear-gradient(180deg, #7a8a9a 0%, #9aacba 40%, #b0c0d0 100%)",
      mountainFill: "#4a5a6a",
      snowFill: "#c8d0d8",
      cloudOpacity: 0.7,
      sunMoonColor: "#ccc",
      showSun: false,
      showMoon: false,
      showStars: false,
      glowColor: "rgba(150, 170, 190, 0.2)",
      fogOpacity: fogOpacity,
      label: "Overcast",
    };
  }

  // Partly cloudy day
  if (isPartlyCloudy) {
    return {
      skyGradient:
        "linear-gradient(180deg, #4a90d9 0%, #6aade0 40%, #87CEEB 70%, #b0e0ff 100%)",
      mountainFill: "#2a3a5a",
      snowFill: "#e8f0ff",
      cloudOpacity: cloudOpacity,
      sunMoonColor: "#FFD700",
      showSun: true,
      showMoon: false,
      showStars: false,
      glowColor: "rgba(255, 215, 0, 0.2)",
      fogOpacity,
      label: "Partly cloudy",
    };
  }

  // Clear day (default)
  return {
    skyGradient:
      "linear-gradient(180deg, #1e6fd9 0%, #3a8ee6 30%, #60b0f0 60%, #87CEEB 100%)",
    mountainFill: "#2a3a5a",
    snowFill: "#ffffff",
    cloudOpacity: cloudOpacity,
    sunMoonColor: "#FFD700",
    showSun: true,
    showMoon: false,
    showStars: false,
    glowColor: "rgba(255, 215, 0, 0.25)",
    fogOpacity: 0,
    label: "Clear sky",
  };
}
