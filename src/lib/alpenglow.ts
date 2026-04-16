/**
 * Alpenglow Prediction Algorithm
 *
 * Alpenglow occurs when low-angle sunlight near sunset refracts through
 * thin high-altitude cirrus clouds and illuminates Mt. Rainier's snow
 * with brilliant pink/orange light.
 *
 * Conditions for Alpenglow:
 * 1. Low clouds must be clear (0-20%) — sightline to mountain is unobstructed
 * 2. Mid clouds must be low (0-25%) — no thick blanket diffusing light
 * 3. High cirrus clouds should be present (40-80%) — these act as the
 *    "canvas" that refracts and scatters warm-spectrum sunset light
 * 4. Must be near sunset (within ~60 min)
 * 5. Mountain must already be visible (score >= 60)
 *
 * The "sweet spot" for alpenglow is high clouds at 50-70% — enough cirrus
 * to catch light, but not so dense that it blocks the sun entirely.
 */

export interface AlpenglowPrediction {
  probability: number;       // 0-100
  isLikely: boolean;         // probability >= 60
  minutesToSunset: number;   // negative = past sunset
  conditions: {
    lowCloudsClear: boolean;
    midCloudsClear: boolean;
    highCirrusPresent: boolean;
    nearSunset: boolean;
    mountainVisible: boolean;
  };
}

/**
 * Calculate alpenglow probability from current weather conditions.
 */
export function predictAlpenglow(
  cloudLow: number,
  cloudMid: number,
  cloudHigh: number,
  sunset: string,
  visibilityScore: number
): AlpenglowPrediction {
  const now = new Date();
  const sunsetTime = new Date(sunset);
  const minutesToSunset = (sunsetTime.getTime() - now.getTime()) / (1000 * 60);

  const conditions = {
    lowCloudsClear: cloudLow <= 20,
    midCloudsClear: cloudMid <= 25,
    highCirrusPresent: cloudHigh >= 40 && cloudHigh <= 80,
    nearSunset: minutesToSunset > -10 && minutesToSunset <= 60,
    mountainVisible: visibilityScore >= 60,
  };

  // Score each condition independently, then combine
  let probability = 0;

  // Low clouds: must be clear. 0% = perfect, 20% = acceptable, >20% = kills it
  if (cloudLow <= 5) probability += 25;
  else if (cloudLow <= 15) probability += 20;
  else if (cloudLow <= 20) probability += 12;
  else probability += Math.max(0, 5 - (cloudLow - 20) / 4); // rapidly falls off

  // Mid clouds: should be minimal
  if (cloudMid <= 10) probability += 20;
  else if (cloudMid <= 20) probability += 15;
  else if (cloudMid <= 25) probability += 8;
  else probability += Math.max(0, 3 - (cloudMid - 25) / 5);

  // High cirrus: the magic ingredient. Sweet spot is 50-70%
  if (cloudHigh >= 50 && cloudHigh <= 70) probability += 30;
  else if (cloudHigh >= 40 && cloudHigh <= 80) probability += 22;
  else if (cloudHigh >= 30 && cloudHigh <= 85) probability += 12;
  else if (cloudHigh >= 20) probability += 5;
  // No high clouds = no canvas for light = no alpenglow

  // Sunset proximity: peaks at 20-40min before sunset
  if (minutesToSunset >= 20 && minutesToSunset <= 40) probability += 20;
  else if (minutesToSunset >= 10 && minutesToSunset <= 50) probability += 15;
  else if (minutesToSunset >= 0 && minutesToSunset <= 60) probability += 8;
  else if (minutesToSunset >= -10 && minutesToSunset < 0) probability += 5; // just past sunset, afterglow
  // Not near sunset = 0 points

  // Mountain visibility: must be visible for you to see the alpenglow
  if (visibilityScore >= 80) probability += 5;
  else if (visibilityScore >= 60) probability += 2;
  // Below 60 = no bonus, mountain is borderline or hidden

  // Clamp
  probability = Math.max(0, Math.min(100, Math.round(probability)));

  return {
    probability,
    isLikely: probability >= 60,
    minutesToSunset: Math.round(minutesToSunset),
    conditions,
  };
}

/**
 * Find the best alpenglow window in today's hourly forecast.
 * Looks at hours around sunset to find when conditions peak.
 */
export function findAlpenglowWindow(
  hourlyForecast: { time: string; cloudLow: number; cloudMid: number; cloudHigh: number }[],
  sunset: string,
  visibilityScore: number
): { bestHour: string | null; bestProbability: number } {
  const sunsetTime = new Date(sunset);
  let bestHour: string | null = null;
  let bestProbability = 0;

  for (const hour of hourlyForecast) {
    const hourTime = new Date(hour.time);
    const minsToSunset = (sunsetTime.getTime() - hourTime.getTime()) / (1000 * 60);

    // Only check hours within 90 min of sunset
    if (minsToSunset < -15 || minsToSunset > 90) continue;

    const prediction = predictAlpenglow(
      hour.cloudLow,
      hour.cloudMid,
      hour.cloudHigh,
      sunset,
      visibilityScore
    );

    if (prediction.probability > bestProbability) {
      bestProbability = prediction.probability;
      bestHour = hour.time;
    }
  }

  return { bestHour, bestProbability };
}
