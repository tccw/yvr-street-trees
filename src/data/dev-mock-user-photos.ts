import { FeatureCollection, Point } from "@turf/turf";

function makeMockSvgDataUri(
  title: string,
  subtitle: string,
  width: number,
  height: number,
  bgStart: string,
  bgEnd: string,
  accent: string
): string {
  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);
  const r = minDim * 0.16;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)" />
    <rect x="12" y="12" width="${width - 24}" height="${height - 24}" fill="none" stroke="${accent}" stroke-width="8" stroke-dasharray="20 10" rx="16" />
    <rect x="${cx - r * 0.18}" y="${cy - r * 0.2}" width="${r * 0.36}" height="${r * 1.1}" rx="6" fill="#5c4033" />
    <circle cx="${cx}" cy="${cy - r * 0.6}" r="${r}" fill="${accent}" opacity="0.9" />
    <circle cx="${cx - r * 0.55}" cy="${cy - r * 0.25}" r="${r * 0.75}" fill="${accent}" opacity="0.8" />
    <circle cx="${cx + r * 0.55}" cy="${cy - r * 0.25}" r="${r * 0.75}" fill="${accent}" opacity="0.8" />
    <text x="${cx}" y="${cy + r * 1.4}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${Math.round(minDim * 0.055)}" font-weight="700" fill="#ffffff">${title}</text>
    <text x="${cx}" y="${cy + r * 1.4 + Math.round(minDim * 0.065)}" text-anchor="middle" font-family="monospace" font-size="${Math.round(minDim * 0.04)}" fill="#e2e8f0">${subtitle}</text>
  </svg>`;

  const encoded = encodeURIComponent(svg)
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/'/g, "%27");

  return `data:image/svg+xml;utf8,${encoded}`;
}

// Clustered near GEOCODER_PROXIMITY (-123.151833, 49.246708) within 500m
// so clicking the heatmap/circle marker selects all 5 mock photos together.
export const DEV_MOCK_USER_PHOTOS: FeatureCollection<Point> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-123.151833, 49.246708],
      },
      properties: {
        public_id: makeMockSvgDataUri(
          "Mock Photo 1 (Portrait)",
          "3:4 • 900x1200",
          900,
          1200,
          "#1e3a5f",
          "#0f2027",
          "#4ade80"
        ),
        created_at_utc: "2026-11-10T18:30:00Z",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-123.1525, 49.2471],
      },
      properties: {
        public_id: makeMockSvgDataUri(
          "Mock Photo 2 (Landscape)",
          "4:3 • 1200x900",
          1200,
          900,
          "#3b1d5e",
          "#1a1033",
          "#f472b6"
        ),
        created_at_utc: "2026-11-09T15:20:00Z",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-123.1511, 49.2463],
      },
      properties: {
        public_id: makeMockSvgDataUri(
          "Mock Photo 3 (Tall Phone)",
          "9:16 • 720x1280",
          720,
          1280,
          "#134e4a",
          "#062c2a",
          "#38bdf8"
        ),
        created_at_utc: "2026-11-08T12:00:00Z",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-123.1522, 49.2462],
      },
      properties: {
        public_id: makeMockSvgDataUri(
          "Mock Photo 4 (Wide)",
          "16:9 • 1280x720",
          1280,
          720,
          "#7c2d12",
          "#431407",
          "#facc15"
        ),
        created_at_utc: "2026-11-07T09:45:00Z",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [-123.1514, 49.2472],
      },
      properties: {
        public_id: makeMockSvgDataUri(
          "Mock Photo 5 (Square)",
          "1:1 • 1000x1000",
          1000,
          1000,
          "#312e81",
          "#1e1b4b",
          "#a78bfa"
        ),
        created_at_utc: "2026-11-06T20:15:00Z",
      },
    },
  ],
};

export function isDirectImageUrl(id: string): boolean {
  return (
    id.startsWith("data:") ||
    id.startsWith("/") ||
    id.startsWith("http://") ||
    id.startsWith("https://")
  );
}
