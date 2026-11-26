export type CityKey = "metro" | "victoria" | "winnipeg" | "calgary";

export interface ContactLink {
  label: string;
  url: string;
}

const CITY_MAP_LINKS: Record<CityKey, ContactLink> = {
  metro: { label: "Metro Van Tree Map", url: "https://vancouver.treemap.ca" },
  victoria: { label: "Victoria Tree Map", url: "https://victoria.treemap.ca" },
  winnipeg: { label: "Winnipeg Tree Map", url: "https://winnipeg.treemap.ca" },
  calgary: { label: "Calgary Tree Map", url: "https://calgary.treemap.ca" },
};

function otherCityMaps(self: CityKey): ContactLink[] {
  return (Object.keys(CITY_MAP_LINKS) as CityKey[])
    .filter((k) => k !== self)
    .map((k) => CITY_MAP_LINKS[k]);
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
  hasHeightFilter: boolean;
  welcomeMsg: string;
  attribution: string;
  footerDataText: string;
  contactLinks: ContactLink[];
  siblingMaps: ContactLink[];
}

export const CITY_CONFIGS: Record<CityKey, CityConfig> = {
  metro: {
    key: "metro",
    hasHeightFilter: true,
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
    siblingMaps: otherCityMaps("metro"),
  },
  victoria: {
    key: "victoria",
    hasHeightFilter: true,
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
    siblingMaps: otherCityMaps("victoria"),
  },
  winnipeg: {
    key: "winnipeg",
    hasHeightFilter: false,
    title: "Winnipeg Tree Map",
    regionalHeading: "Citywide",
    regionalName: "Winnipeg",
    shortLabel: "Winnipeg",
    tilesUrl: "mapbox://tcowan.winnipeg-trees",
    boundariesUrl: "/data/winnipeg-boundaries-processed.json",
    statsUrl: "/data/winnipeg-trees-stats.json",
    dbUrl: "/data/winnipeg-trees-id-to-location-map.db",
    initialCenter: { longitude: -97.1384, latitude: 49.8951 },
    initialZoom: 11.5,
    minZoom: 10,
    maxZoom: 18.5,
    bounds: [
      [-97.55, 49.68],
      [-96.75, 50.04],
    ],
    welcomeMsg: JSON.stringify([
      "Welcome to the Winnipeg Tree Map! Explore over 300,000 public trees across the City of Winnipeg.",
      "Click a neighbourhood to view local stats, or zoom in to inspect individual trees. Use the Tree Filter to search by species or trunk diameter.",
    ]),
    attribution: "Wiki CC BY-SA 3.0 | City of Winnipeg Open Data",
    footerDataText: "Data: City of Winnipeg Open Data",
    contactLinks: [
      {
        label: "City of Winnipeg Urban Forestry",
        url: "https://legacy.winnipeg.ca/publicworks/parksOpenSpace/UrbanForestry/default.stm",
      },
    ],
    siblingMaps: otherCityMaps("winnipeg"),
  },
  calgary: {
    key: "calgary",
    hasHeightFilter: false,
    title: "Calgary Tree Map",
    regionalHeading: "Citywide",
    regionalName: "Calgary",
    shortLabel: "Calgary",
    tilesUrl: "mapbox://tcowan.calgary-trees",
    boundariesUrl: "/data/calgary-boundaries-processed.json",
    statsUrl: "/data/calgary-trees-stats.json",
    dbUrl: "/data/calgary-trees-id-to-location-map.db",
    initialCenter: { longitude: -114.0719, latitude: 51.0447 },
    initialZoom: 11,
    minZoom: 9.5,
    maxZoom: 18.5,
    bounds: [
      [-114.55, 50.78],
      [-113.62, 51.28],
    ],
    welcomeMsg: JSON.stringify([
      "Welcome to the Calgary Tree Map! Explore nearly 500,000 public trees across the City of Calgary.",
      "Click a community to view local stats, or zoom in to inspect individual trees. Use the Tree Filter to search by species or trunk diameter.",
    ]),
    attribution: "Wiki CC BY-SA 3.0 | City of Calgary Open Data",
    footerDataText: "Data: City of Calgary Open Data",
    contactLinks: [
      {
        label: "City of Calgary Urban Forestry",
        url: "https://www.calgary.ca/parks/trees.html",
      },
    ],
    siblingMaps: otherCityMaps("calgary"),
  },
};

function resolveCityKey(): CityKey {
  if (typeof window !== "undefined") {
    const param = new URLSearchParams(window.location.search).get("city");
    if (
      param === "victoria" ||
      param === "winnipeg" ||
      param === "calgary" ||
      param === "metro"
    ) {
      return param;
    }
  }
  const envCity = import.meta.env.VITE_CITY;
  if (
    envCity === "victoria" ||
    envCity === "winnipeg" ||
    envCity === "calgary" ||
    envCity === "metro"
  ) {
    return envCity;
  }
  return "metro";
}

export const ACTIVE_CITY: CityConfig = CITY_CONFIGS[resolveCityKey()];
