export type CityKey = "metro" | "victoria";

export interface ContactLink {
  label: string;
  url: string;
}

export interface CityConfig {
  key: CityKey;
  title: string;
  regionalHeading: string;
  regionalName: string;
  shortLabel: string;
  tilesUrl: string;
  boundariesUrl: string;
  statsUrl: string;
  dbUrl: string;
  initialCenter: { longitude: number; latitude: number };
  initialZoom: number;
  minZoom: number;
  maxZoom: number;
  bounds: [[number, number], [number, number]];
  welcomeMsg: string;
  attribution: string;
  footerDataText: string;
  contactLinks: ContactLink[];
  siblingMaps: ContactLink[];
}

export const CITY_CONFIGS: Record<CityKey, CityConfig> = {
  metro: {
    key: "metro",
    title: "Metro Van Tree Map",
    regionalHeading: "Regional",
    regionalName: "Metro Vancouver",
    shortLabel: "Metro Van",
    tilesUrl: "mapbox://tcowan.metro-trees",
    boundariesUrl: "/data/metro-boundaries-processed.json",
    statsUrl: "/data/metro-all-trees-processed-stats.json",
    dbUrl: "/data/metro-all-trees-id-to-location-map.db",
    initialCenter: { longitude: -123.151833, latitude: 49.246708 },
    initialZoom: 11.5,
    minZoom: 10,
    maxZoom: 18.5,
    bounds: [
      [-123.38, 49.08],
      [-122.72, 49.38],
    ],
    welcomeMsg: JSON.stringify([
      "Welcome to the Metro Vancouver Tree Map! Explore over 210,000 public trees across Vancouver, New Westminster, and the City of North Vancouver.",
      "Click a neighbourhood to view local stats, or zoom in to inspect individual trees. Use the Tree Filter to search by species, trunk diameter, or height.",
    ]),
    attribution:
      "Wiki CC BY-SA 3.0 | OGL - Vancouver & New Westminster | CNV Spatial Data (Data Sharing Agreement)",
    footerDataText:
      "Data: Vancouver & New Westminster (OGL), City of North Vancouver (Data Sharing Agreement)",
    contactLinks: [
      {
        label: "Van311",
        url: "https://van311.ca/services/city-and-park-trees-maintenance",
      },
      {
        label: "New Westminster",
        url: "https://www.newwestcity.ca/parks-recreation/parks/trees-natural-areas/trees/city-trees",
      },
      {
        label: "City of North Vancouver",
        url: "https://www.cnv.org/community-environment/trees/public-trees",
      },
    ],
    siblingMaps: [
      {
        label: "Victoria Tree Map",
        url: "https://victoria.treemap.ca",
      },
    ],
  },
  victoria: {
    key: "victoria",
    title: "Victoria Tree Map",
    regionalHeading: "Citywide",
    regionalName: "Victoria",
    shortLabel: "Victoria",
    tilesUrl: "mapbox://tcowan.victoria-trees",
    boundariesUrl: "/data/victoria-boundaries-processed.json",
    statsUrl: "/data/victoria-trees-stats.json",
    dbUrl: "/data/victoria-trees-id-to-location-map.db",
    initialCenter: { longitude: -123.3656, latitude: 48.4284 },
    initialZoom: 12.5,
    minZoom: 11,
    maxZoom: 18.5,
    bounds: [
      [-123.45, 48.38],
      [-123.28, 48.49],
    ],
    welcomeMsg: JSON.stringify([
      "Welcome to the Victoria Tree Map! Explore nearly 35,000 public and park trees across the City of Victoria.",
      "Click a neighbourhood to view local stats, or zoom in to inspect individual trees. Use the Tree Filter to search by species, trunk diameter, or height.",
    ]),
    attribution: "Wiki CC BY-SA 3.0 | City of Victoria Open Data",
    footerDataText: "Data: City of Victoria Open Data",
    contactLinks: [
      {
        label: "City of Victoria Service Requests",
        url: "https://www.victoria.ca/service-requests",
      },
    ],
    siblingMaps: [
      {
        label: "Metro Van Tree Map",
        url: "https://vancouver.treemap.ca",
      },
    ],
  },
};

function resolveCityKey(): CityKey {
  if (typeof window !== "undefined") {
    const param = new URLSearchParams(window.location.search).get("city");
    if (param === "victoria" || param === "metro") {
      return param;
    }
  }
  const envCity = import.meta.env.VITE_CITY;
  if (envCity === "victoria" || envCity === "metro") {
    return envCity;
  }
  return "metro";
}

export const ACTIVE_CITY: CityConfig = CITY_CONFIGS[resolveCityKey()];
