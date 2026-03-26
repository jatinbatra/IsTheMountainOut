export interface Viewpoint {
  id: string;
  name: string;
  description: string;
  distanceMiles: number;
  direction: string;
  elevation: number;
  bestFor: string;
  lat: number;
  lon: number;
  region: "seattle" | "eastside" | "south" | "tacoma" | "north";
  mapsUrl: string;
  // Factors that affect per-location visibility
  elevationAdvantage: number;   // 0-1, how much elevation helps cut through haze
  obstructionFactor: number;    // 0-1, how much buildings/terrain block the view (0 = no obstruction)
  distancePenalty: number;      // 0-1, normalized distance penalty
}

export const VIEWPOINTS: Viewpoint[] = [
  // --- Seattle ---
  {
    id: "kerry-park",
    name: "Kerry Park",
    description:
      "The iconic Seattle viewpoint on Queen Anne Hill. Unobstructed view of the skyline with Rainier rising behind it. The single most famous spot to see the mountain from the city.",
    distanceMiles: 58,
    direction: "SSE",
    elevation: 400,
    bestFor: "Photography & iconic skyline shots",
    lat: 47.6295,
    lon: -122.3594,
    region: "seattle",
    mapsUrl: "https://www.google.com/maps/place/Kerry+Park/@47.6295,-122.3594,17z",
    elevationAdvantage: 0.7,
    obstructionFactor: 0.05,
    distancePenalty: 0.4,
  },
  {
    id: "jose-rizal-bridge",
    name: "Jose Rizal Bridge",
    description:
      "South-facing viewpoint in Beacon Hill. The mountain fills the horizon beyond the industrial district and stadiums. One of the best framings of Rainier from the city.",
    distanceMiles: 56,
    direction: "S",
    elevation: 280,
    bestFor: "Urban framing & photography",
    lat: 47.5719,
    lon: -122.3189,
    region: "seattle",
    mapsUrl: "https://www.google.com/maps/place/Dr.+Jose+Rizal+Bridge/@47.5719,-122.3189,17z",
    elevationAdvantage: 0.5,
    obstructionFactor: 0.1,
    distancePenalty: 0.38,
  },
  {
    id: "belltown-waterfront",
    name: "Belltown Waterfront / Olympic Sculpture Park",
    description:
      "Walk along the waterfront near the Olympic Sculpture Park. The mountain appears to float above the industrial area to the south. Beautiful at sunset.",
    distanceMiles: 57,
    direction: "SSE",
    elevation: 20,
    bestFor: "Casual walks & sunset views",
    lat: 47.6145,
    lon: -122.3551,
    region: "seattle",
    mapsUrl: "https://www.google.com/maps/place/Olympic+Sculpture+Park/@47.6166,-122.3553,17z",
    elevationAdvantage: 0.1,
    obstructionFactor: 0.15,
    distancePenalty: 0.39,
  },
  {
    id: "columbia-center",
    name: "Columbia Center Sky View Observatory",
    description:
      "The tallest public viewpoint in Seattle at 902 feet. On clear days, Rainier dominates the south view. The altitude lets you see above most low haze and fog layers.",
    distanceMiles: 57,
    direction: "S",
    elevation: 902,
    bestFor: "Above-the-clouds views & rainy day visits",
    lat: 47.6047,
    lon: -122.3308,
    region: "seattle",
    mapsUrl: "https://www.google.com/maps/place/Sky+View+Observatory/@47.6047,-122.3308,17z",
    elevationAdvantage: 1.0,
    obstructionFactor: 0.0,
    distancePenalty: 0.39,
  },
  {
    id: "south-lake-union",
    name: "South Lake Union Park",
    description:
      "Near the Museum of History & Industry on the lake's south shore. On clear days, Rainier peeks between buildings with seaplanes and houseboats in the foreground.",
    distanceMiles: 57,
    direction: "SSE",
    elevation: 30,
    bestFor: "Urban waterfront views & dining",
    lat: 47.6243,
    lon: -122.3365,
    region: "seattle",
    mapsUrl: "https://www.google.com/maps/place/South+Lake+Union+Park/@47.6243,-122.3365,17z",
    elevationAdvantage: 0.15,
    obstructionFactor: 0.25,
    distancePenalty: 0.39,
  },
  {
    id: "gasworks-park",
    name: "Gas Works Park",
    description:
      "Perched on a hill at the north end of Lake Union. The mountain view here is south-facing across the entire lake and city skyline. Great for kites and picnics.",
    distanceMiles: 59,
    direction: "S",
    elevation: 50,
    bestFor: "Panoramic skyline + mountain combo",
    lat: 47.6456,
    lon: -122.3344,
    region: "seattle",
    mapsUrl: "https://www.google.com/maps/place/Gas+Works+Park/@47.6456,-122.3344,17z",
    elevationAdvantage: 0.25,
    obstructionFactor: 0.1,
    distancePenalty: 0.42,
  },
  {
    id: "hamilton-viewpoint",
    name: "Hamilton Viewpoint Park",
    description:
      "A hidden gem in West Seattle overlooking the Duwamish waterway. Provides a unique industrial foreground with Rainier towering behind. Less crowded than Kerry Park.",
    distanceMiles: 55,
    direction: "SE",
    elevation: 200,
    bestFor: "Uncrowded views & industrial Seattle vibes",
    lat: 47.5795,
    lon: -122.3856,
    region: "seattle",
    mapsUrl: "https://www.google.com/maps/place/Hamilton+Viewpoint+Park/@47.5795,-122.3856,17z",
    elevationAdvantage: 0.4,
    obstructionFactor: 0.08,
    distancePenalty: 0.36,
  },
  // --- Eastside ---
  {
    id: "marymoor-park",
    name: "Marymoor Park, Redmond",
    description:
      "A massive eastside park with wide-open fields. Rainier dominates the southeastern horizon without any skyline obstruction. Popular for dog walking and cycling.",
    distanceMiles: 52,
    direction: "SSE",
    elevation: 30,
    bestFor: "Wide panoramic views & outdoor activities",
    lat: 47.663,
    lon: -122.1185,
    region: "eastside",
    mapsUrl: "https://www.google.com/maps/place/Marymoor+Park/@47.663,-122.1185,15z",
    elevationAdvantage: 0.15,
    obstructionFactor: 0.0,
    distancePenalty: 0.33,
  },
  {
    id: "newcastle-beach",
    name: "Newcastle Beach Park",
    description:
      "Eastside lakefront park on Lake Washington. The mountain rises beautifully above the Bellevue skyline on clear days. Combine with a swim in summer.",
    distanceMiles: 50,
    direction: "SSE",
    elevation: 25,
    bestFor: "Lake + mountain combo views",
    lat: 47.5357,
    lon: -122.1607,
    region: "eastside",
    mapsUrl: "https://www.google.com/maps/place/Newcastle+Beach+Park/@47.5357,-122.1607,17z",
    elevationAdvantage: 0.1,
    obstructionFactor: 0.05,
    distancePenalty: 0.3,
  },
  {
    id: "poo-poo-point",
    name: "Poo Poo Point, Issaquah",
    description:
      "A popular hiking trail near Tiger Mountain. At 1,791 ft elevation, you're high enough to see Rainier above most haze. Paragliders launch from here on clear days.",
    distanceMiles: 47,
    direction: "SSE",
    elevation: 1791,
    bestFor: "Hiking with epic mountain views",
    lat: 47.5022,
    lon: -122.0246,
    region: "eastside",
    mapsUrl: "https://www.google.com/maps/place/Poo+Poo+Point/@47.5022,-122.0246,15z",
    elevationAdvantage: 0.95,
    obstructionFactor: 0.0,
    distancePenalty: 0.25,
  },
  // --- South / Tacoma ---
  {
    id: "point-ruston",
    name: "Point Ruston, Tacoma",
    description:
      "Waterfront boardwalk on Commencement Bay. At only 30 miles from Rainier, the mountain looms incredibly large. One of the closest urban viewpoints.",
    distanceMiles: 32,
    direction: "SE",
    elevation: 15,
    bestFor: "Close-up mountain views & waterfront walks",
    lat: 47.3025,
    lon: -122.5143,
    region: "tacoma",
    mapsUrl: "https://www.google.com/maps/place/Point+Ruston/@47.3025,-122.5143,15z",
    elevationAdvantage: 0.05,
    obstructionFactor: 0.02,
    distancePenalty: 0.1,
  },
  {
    id: "stadium-way-tacoma",
    name: "Stadium Way Viewpoint, Tacoma",
    description:
      "Elevated viewpoint in Tacoma's Stadium District. The mountain appears massive from here, nearly twice as large as from Seattle. Views across Commencement Bay.",
    distanceMiles: 33,
    direction: "ESE",
    elevation: 250,
    bestFor: "Close-up Rainier views",
    lat: 47.2603,
    lon: -122.4498,
    region: "tacoma",
    mapsUrl: "https://www.google.com/maps/place/Stadium+Way+Viewpoint/@47.2603,-122.4498,17z",
    elevationAdvantage: 0.5,
    obstructionFactor: 0.05,
    distancePenalty: 0.12,
  },
  {
    id: "bonney-lake",
    name: "Bonney Lake Viewpoint",
    description:
      "A suburb east of Tacoma sitting on a plateau. On clear days, Rainier fills the entire eastern sky. Easily some of the best casual views of the mountain.",
    distanceMiles: 25,
    direction: "E",
    elevation: 1400,
    bestFor: "Close proximity views",
    lat: 47.1862,
    lon: -122.1862,
    region: "south",
    mapsUrl: "https://www.google.com/maps/place/Bonney+Lake,+WA/@47.1862,-122.1862,13z",
    elevationAdvantage: 0.85,
    obstructionFactor: 0.0,
    distancePenalty: 0.05,
  },
  // --- North ---
  {
    id: "edmonds-waterfront",
    name: "Edmonds Waterfront",
    description:
      "Charming waterfront town north of Seattle. On clear days, you can see Rainier far to the south across Puget Sound. Best combined with a ferry-watching session.",
    distanceMiles: 68,
    direction: "SSE",
    elevation: 15,
    bestFor: "Distant mountain views & small-town charm",
    lat: 47.8107,
    lon: -122.3774,
    region: "north",
    mapsUrl: "https://www.google.com/maps/place/Edmonds+Waterfront/@47.8107,-122.3774,16z",
    elevationAdvantage: 0.05,
    obstructionFactor: 0.12,
    distancePenalty: 0.55,
  },
  {
    id: "mt-walker",
    name: "Mt. Walker Viewpoint",
    description:
      "A drive-up viewpoint on the Olympic Peninsula. From across Puget Sound, you get a full panorama of the Cascade Range with Rainier front and center.",
    distanceMiles: 80,
    direction: "ESE",
    elevation: 2804,
    bestFor: "Full Cascade Range panorama",
    lat: 47.7532,
    lon: -122.9116,
    region: "north",
    mapsUrl: "https://www.google.com/maps/place/Mount+Walker+Viewpoint/@47.7532,-122.9116,14z",
    elevationAdvantage: 1.0,
    obstructionFactor: 0.0,
    distancePenalty: 0.7,
  },
];

/**
 * Calculate a per-viewpoint visibility confidence based on the base visibility
 * score and location-specific factors.
 */
export function getViewpointConfidence(
  baseScore: number,
  viewpoint: Viewpoint,
  visibilityMiles: number,
  pm25?: number
): { score: number; confidence: string; skyDescription: string } {
  let locationScore = baseScore;

  // Elevation advantage: higher viewpoints see above low clouds/haze
  // This matters most when visibility is marginal (30-70)
  if (baseScore < 80) {
    locationScore += viewpoint.elevationAdvantage * 15;
  }

  // Obstruction penalty: buildings/terrain blocking view
  locationScore -= viewpoint.obstructionFactor * 12;

  // Distance penalty: farther = more atmosphere to look through
  locationScore -= viewpoint.distancePenalty * 10;

  // Haze interaction: higher viewpoints do better in hazy conditions
  if (visibilityMiles < 30 && viewpoint.elevation > 500) {
    locationScore += 8; // elevated viewpoints cut through haze
  }

  // Air quality interaction
  if (pm25 !== undefined && pm25 > 20) {
    if (viewpoint.elevation > 500) {
      locationScore += 5; // elevated spots above ground-level pollution
    } else {
      locationScore -= 5; // low spots suffer more
    }
  }

  // Closer viewpoints see the mountain bigger, so even partial views work
  if (viewpoint.distanceMiles < 40) {
    locationScore += 5;
  }

  locationScore = Math.max(0, Math.min(100, Math.round(locationScore)));

  const confidence =
    locationScore >= 80
      ? "high"
      : locationScore >= 60
        ? "moderate"
        : locationScore >= 40
          ? "low"
          : "very low";

  const skyDescription = getSkyDescription(locationScore, viewpoint);

  return { score: locationScore, confidence, skyDescription };
}

function getSkyDescription(score: number, viewpoint: Viewpoint): string {
  if (score >= 85) {
    if (viewpoint.distanceMiles < 40) {
      return "Wide open skies. The mountain will be massive with visible glaciers and snow detail.";
    }
    return "Clean skies with sharp definition of the peak and snowfields.";
  }
  if (score >= 70) {
    if (viewpoint.elevation > 500) {
      return "Clear above the haze layer. Crisp views of the upper mountain and snow cap.";
    }
    return "Mostly clear. Good mountain outline with some atmospheric haze softening the base.";
  }
  if (score >= 55) {
    if (viewpoint.elevation > 500) {
      return "Partly hazy but the elevation helps. Mountain visible with muted colors.";
    }
    return "Hazy skies. Mountain visible as a faint silhouette, best with binoculars.";
  }
  if (score >= 40) {
    return "Significant haze or partial clouds. May catch glimpses but not reliable.";
  }
  if (score >= 25) {
    return "Mostly obscured. Heavy clouds or haze, unlikely to see more than a shadow.";
  }
  return "Socked in. Clouds or fog blocking all views of the mountain.";
}

/**
 * Rank viewpoints based on current conditions and return with per-location scores.
 */
export function rankViewpoints(
  baseScore: number,
  isVisible: boolean,
  visibilityMiles: number,
  pm25?: number
): (Viewpoint & { locationScore: number; locationConfidence: string; skyDescription: string })[] {
  const scored = VIEWPOINTS.map((vp) => {
    const { score, confidence, skyDescription } = getViewpointConfidence(
      baseScore,
      vp,
      visibilityMiles,
      pm25
    );
    return {
      ...vp,
      locationScore: score,
      locationConfidence: confidence,
      skyDescription,
    };
  });

  // Sort by location-specific score, with region tiebreaker
  // When scores are within 5 points, prefer iconic Seattle viewpoints
  const regionPriority: Record<string, number> = { seattle: 3, eastside: 2, north: 1, tacoma: 1, south: 0 };
  return scored.sort((a, b) => {
    const diff = b.locationScore - a.locationScore;
    if (Math.abs(diff) > 5) return diff;
    return (regionPriority[b.region] ?? 0) - (regionPriority[a.region] ?? 0);
  });
}
