export interface Viewpoint {
  id: string;
  name: string;
  description: string;
  distanceMiles: number;
  direction: string; // compass direction to look
  elevation: number; // feet, approximate viewpoint elevation
  bestFor: string;
  lat: number;
  lon: number;
}

export const VIEWPOINTS: Viewpoint[] = [
  {
    id: "kerry-park",
    name: "Kerry Park",
    description:
      "The iconic Seattle viewpoint on Queen Anne Hill. Offers an unobstructed view of the skyline with Mt. Rainier rising behind it.",
    distanceMiles: 58,
    direction: "SSE",
    elevation: 400,
    bestFor: "Photography & iconic skyline shots",
    lat: 47.6295,
    lon: -122.3594,
  },
  {
    id: "belltown-waterfront",
    name: "Belltown Waterfront",
    description:
      "Walk along the waterfront near the Olympic Sculpture Park. The mountain appears to float above the industrial area to the south.",
    distanceMiles: 57,
    direction: "SSE",
    elevation: 20,
    bestFor: "Casual walks & sunset views",
    lat: 47.6145,
    lon: -122.3551,
  },
  {
    id: "south-lake-union",
    name: "South Lake Union",
    description:
      "Near The Dorian and the lake's south shore. On clear days, Rainier peeks between buildings with seaplanes in the foreground.",
    distanceMiles: 57,
    direction: "SSE",
    elevation: 30,
    bestFor: "Urban views & waterfront dining",
    lat: 47.6243,
    lon: -122.3365,
  },
  {
    id: "marymoor-park",
    name: "Marymoor Park, Redmond",
    description:
      "A massive eastside park with wide-open fields. Rainier dominates the southeastern horizon without any skyline obstruction.",
    distanceMiles: 52,
    direction: "SSE",
    elevation: 30,
    bestFor: "Wide panoramic views & outdoor activities",
    lat: 47.663,
    lon: -122.1185,
  },
];

/**
 * Rank viewpoints based on current conditions.
 * Prefer higher elevation viewpoints when there's low haze,
 * and open-field viewpoints when air quality is moderate.
 */
export function rankViewpoints(
  isVisible: boolean,
  visibilityMiles: number,
  pm25?: number
): Viewpoint[] {
  if (!isVisible) return VIEWPOINTS;

  return [...VIEWPOINTS].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Higher elevation cuts through low haze
    if (visibilityMiles < 30) {
      scoreA += a.elevation > 100 ? 2 : 0;
      scoreB += b.elevation > 100 ? 2 : 0;
    }

    // If air quality is poor, prefer elevated viewpoints
    if (pm25 !== undefined && pm25 > 20) {
      scoreA += a.elevation > 200 ? 2 : 0;
      scoreB += b.elevation > 200 ? 2 : 0;
    }

    // Closer distance is slightly better
    scoreA += (60 - a.distanceMiles) / 10;
    scoreB += (60 - b.distanceMiles) / 10;

    return scoreB - scoreA;
  });
}
