export type RoadId =
  | "nisqually_paradise"
  | "stevens_canyon"
  | "sunrise"
  | "chinook_pass"
  | "mowich";

export interface RoadInfo {
  id: RoadId;
  label: string;
  openMonths: number[];
  note: string;
}

export const ROADS: Record<RoadId, RoadInfo> = {
  nisqually_paradise: {
    id: "nisqually_paradise",
    label: "Nisqually → Paradise",
    openMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    note: "Open year-round. Tire chains often required Nov–Apr; gates open ~9am in winter.",
  },
  stevens_canyon: {
    id: "stevens_canyon",
    label: "Stevens Canyon Road",
    openMonths: [6, 7, 8, 9, 10],
    note: "Typically opens late May, closes mid-October. Connects Paradise to the east side.",
  },
  sunrise: {
    id: "sunrise",
    label: "Sunrise Road",
    openMonths: [7, 8, 9],
    note: "Typically opens early July, closes late September. Highest driveable point in the park.",
  },
  chinook_pass: {
    id: "chinook_pass",
    label: "Chinook Pass (SR 410)",
    openMonths: [6, 7, 8, 9, 10, 11],
    note: "Typically late May to mid-November. Weather-dependent in shoulder seasons.",
  },
  mowich: {
    id: "mowich",
    label: "Mowich Lake Road",
    openMonths: [7, 8, 9, 10],
    note: "Gravel access to Spray Park. Gates open ~July, close with first snow.",
  },
};

export interface Destination {
  id: string;
  name: string;
  road: RoadId;
  driveFromSeattle: string;
  elevation: string;
  highlight: string;
  bestFor: string;
  mapsUrl: string;
  lat: number;
  lon: number;
  photoUrl: string;
  photoCredit: string;
}

export const DESTINATIONS: Destination[] = [
  {
    id: "paradise",
    name: "Paradise",
    road: "nisqually_paradise",
    driveFromSeattle: "2h 15m",
    elevation: "5,400 ft",
    highlight: "Wildflower meadows, glacier views, Jackson Visitor Center.",
    bestFor: "Year-round access. Skiing and snowshoeing Nov–May, meadows in bloom late July.",
    mapsUrl: "https://maps.google.com/?q=Paradise+Mount+Rainier",
    lat: 46.786,
    lon: -121.735,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Mount_Rainier_7431s.JPG/800px-Mount_Rainier_7431s.JPG",
    photoCredit: "Walter Siegmund / CC BY-SA",
  },
  {
    id: "sunrise",
    name: "Sunrise Point",
    road: "sunrise",
    driveFromSeattle: "2h 30m",
    elevation: "6,400 ft",
    highlight: "Highest driveable point. Sweeping alpine panoramas.",
    bestFor: "Clear summer days. Road closed October through June.",
    mapsUrl: "https://maps.google.com/?q=Sunrise+Mount+Rainier",
    lat: 46.915,
    lon: -121.642,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Mount_Rainier_from_the_Silver_Forest_Trail.jpg/800px-Mount_Rainier_from_the_Silver_Forest_Trail.jpg",
    photoCredit: "NPS / Public Domain",
  },
  {
    id: "reflection",
    name: "Reflection Lakes",
    road: "stevens_canyon",
    driveFromSeattle: "2h 20m",
    elevation: "4,860 ft",
    highlight: "The postcard Rainier reflection shot.",
    bestFor: "Calm summer mornings for mirror-smooth water.",
    mapsUrl: "https://maps.google.com/?q=Reflection+Lakes+Mount+Rainier",
    lat: 46.769,
    lon: -121.740,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Reflection_Lakes_with_Mount_Rainier.jpg/800px-Reflection_Lakes_with_Mount_Rainier.jpg",
    photoCredit: "NPS / Public Domain",
  },
  {
    id: "tipsoo",
    name: "Tipsoo Lake",
    road: "chinook_pass",
    driveFromSeattle: "2h 15m",
    elevation: "5,300 ft",
    highlight: "Easy alpine lake, huge wildflower bloom late July.",
    bestFor: "July–September. Photographers love sunset here.",
    mapsUrl: "https://maps.google.com/?q=Tipsoo+Lake",
    lat: 46.871,
    lon: -121.518,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Tipsoo_Lake_and_Mount_Rainier.jpg/800px-Tipsoo_Lake_and_Mount_Rainier.jpg",
    photoCredit: "NPS / Public Domain",
  },
  {
    id: "narada",
    name: "Narada Falls",
    road: "nisqually_paradise",
    driveFromSeattle: "2h 15m",
    elevation: "4,572 ft",
    highlight: "168-ft waterfall right off the road.",
    bestFor: "Year-round. Thunders in spring snowmelt.",
    mapsUrl: "https://maps.google.com/?q=Narada+Falls+Mount+Rainier",
    lat: 46.775,
    lon: -121.742,
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Narada_Falls_Mount_Rainier_National_Park.jpg/800px-Narada_Falls_Mount_Rainier_National_Park.jpg",
    photoCredit: "NPS / Public Domain",
  },
];

export function isRoadOpen(road: RoadInfo, date: Date): boolean {
  const month = date.getMonth() + 1;
  return road.openMonths.includes(month);
}

export interface PassInfo {
  entryFee: string;
  options: { label: string; price: string; note?: string }[];
  timedEntry: { active: boolean; window: string; note: string };
  websiteUrl: string;
}

export function passInfoForDate(date: Date): PassInfo {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const afterMay24 = month > 5 || (month === 5 && day >= 24);
  const beforeSep2 = month < 9 || (month === 9 && day <= 2);
  const timedEntryActive = afterMay24 && beforeSep2;

  return {
    entryFee: "$30 per vehicle (7-day pass)",
    options: [
      { label: "7-day vehicle pass", price: "$30", note: "At any park entrance" },
      { label: "Mt. Rainier annual pass", price: "$55" },
      {
        label: "America the Beautiful",
        price: "$80/yr",
        note: "Covers all NPS parks",
      },
    ],
    timedEntry: {
      active: timedEntryActive,
      window: "Late May – Labor Day",
      note: timedEntryActive
        ? "Timed-entry reservation required for Paradise and Sunrise corridors. Book on recreation.gov."
        : "No timed-entry reservation needed right now. Just show up with a park pass.",
    },
    websiteUrl: "https://www.nps.gov/mora/planyourvisit/fees.htm",
  };
}
