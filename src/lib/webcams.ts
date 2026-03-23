export interface WebcamFeed {
  id: string;
  name: string;
  description: string;
  location: string;
  imageUrl: string;
  sourceUrl: string;
  sourceName: string;
  direction: string; // what direction it's looking
  elevation?: number;
  refreshMinutes: number;
}

/**
 * Curated list of public webcam feeds showing Mt. Rainier.
 * All URLs are from US government sources (USGS, NPS) — public domain, no auth required.
 */
export const WEBCAM_FEEDS: WebcamFeed[] = [
  {
    id: "usgs-longmire",
    name: "Longmire View",
    description:
      "USGS volcanic monitoring camera at Longmire, showing Mt. Rainier's south face up close. One of the best close-up views available — you can see glaciers and weather moving across the peak in real time.",
    location: "Longmire, Mt. Rainier National Park",
    imageUrl: "https://volcview.wr.usgs.gov/ashcam-api/images/webcams/rainier-longmire/current.jpeg",
    sourceUrl: "https://volcview.wr.usgs.gov/ashcam-gui/webcam.html?webcam=rainier-longmire",
    sourceName: "USGS Cascades Volcano Observatory",
    direction: "North toward summit",
    elevation: 2761,
    refreshMinutes: 5,
  },
  {
    id: "usgs-mora-west",
    name: "MORA West",
    description:
      "USGS camera on the west side of Mt. Rainier National Park. Shows the mountain's western glaciers and ridgeline — a dramatic angle most visitors don't get to see.",
    location: "West side, Mt. Rainier National Park",
    imageUrl: "https://volcview.wr.usgs.gov/ashcam-api/images/webcams/rainier-mora-west/current.jpeg",
    sourceUrl: "https://volcview.wr.usgs.gov/ashcam-gui/webcam.html?webcam=rainier-mora-west",
    sourceName: "USGS Cascades Volcano Observatory",
    direction: "East toward summit",
    refreshMinutes: 5,
  },
  {
    id: "nps-muir",
    name: "Camp Muir",
    description:
      "High-altitude NPS camera at Camp Muir (10,100 ft), the base camp for summit climbs. When this camera shows blue sky, climbers are likely heading for the top. Often above the clouds.",
    location: "Camp Muir, 10,100 ft",
    imageUrl: "https://www.nps.gov/webcams-mora/muir.jpg",
    sourceUrl: "https://www.nps.gov/mora/learn/photosmultimedia/webcams.htm",
    sourceName: "National Park Service",
    direction: "South from high camp",
    elevation: 10100,
    refreshMinutes: 10,
  },
  {
    id: "nps-nisqually",
    name: "Nisqually River",
    description:
      "NPS camera overlooking the Nisqually River valley near Longmire. Shows the river fed by Nisqually Glacier meltwater, with forest and the mountain's lower flanks. Great for gauging weather at the park entrance.",
    location: "Longmire area, Nisqually entrance",
    imageUrl: "https://home.nps.gov/webcams-mora/nisquallyRiver.jpg",
    sourceUrl: "https://www.nps.gov/mora/learn/photosmultimedia/webcams.htm",
    sourceName: "National Park Service",
    direction: "Up-valley toward mountain",
    refreshMinutes: 10,
  },
];
