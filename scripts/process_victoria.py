#!/usr/bin/env python3
"""
Process City of Victoria tree inventory & neighbourhood boundary GeoJSONs.

Outputs:
- opendata/processed/victoria-trees-processed.json
- opendata/processed/victoria-trees-processed.ldjson
- public/data/victoria-boundaries-processed.json
- public/data/victoria-trees-stats.json
- public/data/victoria-trees-id-to-location-map.db
"""
import json
import math
import re
import sqlite3
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parent.parent
OPENDATA = ROOT / "opendata"
PUBLIC_DATA = ROOT / "public" / "data"

VIC_TREES_RAW = OPENDATA / "raw" / "victoria-tree-species-inventory.geojson"
VIC_BOUNDARIES_RAW = OPENDATA / "raw" / "victoria-neighbourhood-boundaries.geojson"
COLOR_DICT_PATH = OPENDATA / "processed" / "assigned-tree-colors-seed5.json"

OUT_TREES_JSON = OPENDATA / "processed" / "victoria-trees-processed.json"
OUT_TREES_LDJSON = OPENDATA / "processed" / "victoria-trees-processed.ldjson"
OUT_BOUNDARIES = PUBLIC_DATA / "victoria-boundaries-processed.json"
OUT_STATS = PUBLIC_DATA / "victoria-trees-stats.json"
OUT_DB = PUBLIC_DATA / "victoria-trees-id-to-location-map.db"

FALLBACK_COLOR = "#b0b0b0"

DENSITY_PALETTE = [
    "#e5f5e0",
    "#ccebc5",
    "#b0e0a8",
    "#8fd18b",
    "#6cc072",
    "#49ae5e",
    "#2d954b",
    "#187b38",
    "#086129",
    "#00441b",
]


def point_in_ring(lon: float, lat: float, ring: List[List[float]]) -> bool:
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-15) + xi
        ):
            inside = not inside
        j = i
    return inside


def point_in_polygon(lon: float, lat: float, poly_coords: List[List[List[float]]]) -> bool:
    if not poly_coords or not point_in_ring(lon, lat, poly_coords[0]):
        return False
    return not any(point_in_ring(lon, lat, hole) for hole in poly_coords[1:])


def point_in_geometry(lon: float, lat: float, geometry: Dict[str, Any]) -> bool:
    gtype = geometry.get("type")
    coords = geometry.get("coordinates", [])
    if gtype == "Polygon":
        return point_in_polygon(lon, lat, coords)
    if gtype == "MultiPolygon":
        return any(point_in_polygon(lon, lat, poly) for poly in coords)
    return False


def ring_area_sqkm(ring: List[List[float]]) -> float:
    if len(ring) < 3:
        return 0.0
    avg_lat = sum(pt[1] for pt in ring) / len(ring)
    km_per_deg_lat = 111.32
    km_per_deg_lon = 111.32 * math.cos(math.radians(avg_lat))
    area = 0.0
    n = len(ring)
    for i in range(n):
        x1, y1 = ring[i][0] * km_per_deg_lon, ring[i][1] * km_per_deg_lat
        x2, y2 = ring[(i + 1) % n][0] * km_per_deg_lon, ring[(i + 1) % n][1] * km_per_deg_lat
        area += x1 * y2 - x2 * y1
    return abs(area) * 0.5


def geometry_area_sqkm(geometry: Dict[str, Any]) -> float:
    gtype = geometry.get("type")
    coords = geometry.get("coordinates", [])
    if gtype == "Polygon":
        if not coords:
            return 0.0
        return ring_area_sqkm(coords[0]) - sum(ring_area_sqkm(h) for h in coords[1:])
    if gtype == "MultiPolygon":
        return sum(
            ring_area_sqkm(poly[0]) - sum(ring_area_sqkm(h) for h in poly[1:])
            for poly in coords
            if poly
        )
    return 0.0


def geometry_bbox_and_center(
    geometry: Dict[str, Any]
) -> Tuple[Tuple[float, float, float, float], List[float]]:
    xs: List[float] = []
    ys: List[float] = []
    gtype = geometry.get("type")
    coords = geometry.get("coordinates", [])
    polys = [coords] if gtype == "Polygon" else coords
    for poly in polys:
        for ring in poly:
            for pt in ring:
                xs.append(pt[0])
                ys.append(pt[1])
    if not xs:
        return (0.0, 0.0, 0.0, 0.0), [48.4284, -123.3656]
    bbox = (min(xs), min(ys), max(xs), max(ys))
    # geo_point_2d is [lat, lon] to match Vancouver's convention
    center_lat_lon = [round((bbox[1] + bbox[3]) / 2, 6), round((bbox[0] + bbox[2]) / 2, 6)]
    return bbox, center_lat_lon


def parse_botanical_name(raw: Any) -> Tuple[str, str, str]:
    text = re.sub(r"\s+", " ", str(raw or "")).strip()
    if not text or text.upper() in ("N/A", "UNKNOWN", "NONE", "STUMP", "VACANT"):
        return "UNKNOWN", "SPECIES", "NONE"

    # Extract single-quoted cultivar if present: e.g. "Acer rubrum 'Red Sunset'"
    cultivar = "NONE"
    m = re.search(r"['‘’]([^'‘’]+)['‘’]", text)
    if m:
        cultivar = m.group(1).strip().upper() or "NONE"
        text = (text[: m.start()] + text[m.end() :]).strip()

    parts = text.split()
    if not parts:
        return "UNKNOWN", "SPECIES", cultivar

    genus = parts[0].upper()
    if len(parts) == 1:
        return genus, "SPECIES", cultivar

    # Handle "Genus x epithet" -> "EPITHET X" and "Genus x" -> "XX"
    rest = [p.upper() for p in parts[1:]]
    if rest[0] in ("X", "×"):
        species = f"{rest[1]} X" if len(rest) >= 2 else "XX"
    elif rest[0] in ("SP.", "SPP.", "SP", "SPP"):
        species = "SPECIES"
    else:
        species = rest[0]
    return genus, species, cultivar


def safe_positive_float(val: Any) -> Optional[float]:
    if val is None or val == "":
        return None
    try:
        num = float(val)
        return num if num > 0 else None
    except (TypeError, ValueError):
        return None


def lookup_tree_color(
    color_dict: Dict[str, Any], genus: str, species: str, cultivar: str
) -> str:
    try:
        if cultivar and cultivar != "NONE":
            return color_dict[genus]["species"][species]["cultivars"][cultivar]
        return color_dict[genus]["species"][species]["color"]
    except KeyError:
        try:
            return color_dict[genus]["species"][species]["color"]
        except KeyError:
            return color_dict.get(genus, {}).get("color", FALLBACK_COLOR)


def main() -> None:
    PUBLIC_DATA.mkdir(parents=True, exist_ok=True)
    with open(COLOR_DICT_PATH, "r", encoding="utf-8") as f:
        color_dict = json.load(f)
    with open(VIC_BOUNDARIES_RAW, "r", encoding="utf-8") as f:
        vic_b_raw = json.load(f)
    with open(VIC_TREES_RAW, "r", encoding="utf-8") as f:
        vic_t_raw = json.load(f)

    boundaries: List[Dict[str, Any]] = []
    spatial_index: List[Tuple[str, Tuple[float, float, float, float], Dict[str, Any]]] = []
    for feat in vic_b_raw.get("features", []):
        p = feat.get("properties") or {}
        name = (p.get("Neighbourhood") or p.get("name") or "").strip()
        geom = feat.get("geometry")
        if not name or not geom:
            continue
        bbox, center_lat_lon = geometry_bbox_and_center(geom)
        spatial_index.append((name, bbox, geom))
        boundaries.append(
            {
                "type": "Feature",
                "geometry": geom,
                "properties": {
                    "city": "victoria",
                    "name": name,
                    "stats_key": f"victoria:{name}",
                    "geo_point_2d": center_lat_lon,
                    "description": [],
                },
            }
        )

    def find_neighbourhood(lon: float, lat: float) -> Optional[str]:
        for name, (minx, miny, maxx, maxy), geom in spatial_index:
            if minx <= lon <= maxx and miny <= lat <= maxy:
                if point_in_geometry(lon, lat, geom):
                    return name
        return None

    processed_trees: List[Dict[str, Any]] = []
    for feat in vic_t_raw.get("features", []):
        geom = feat.get("geometry")
        if not geom or not geom.get("coordinates"):
            continue
        p = feat.get("properties") or {}
        lon, lat = round(geom["coordinates"][0], 6), round(geom["coordinates"][1], 6)
        g, s, c = parse_botanical_name(p.get("BotanicalName") or p.get("Species"))

        raw_cn = re.sub(r"\s+", " ", str(p.get("CommonName") or "")).strip().upper()
        if not raw_cn or raw_cn in ("N/A", "UNKNOWN"):
            cn = "UNKNOWN" if g == "UNKNOWN" else (f"{g} {s}" if s != "SPECIES" else g)
        else:
            cn = raw_cn

        diam = safe_positive_float(p.get("DiameterAtBreastHeight"))
        height = safe_positive_float(p.get("Height"))
        height_id = round(height / 3.0) if height is not None else None

        addr_num = str(p.get("Address") or "").strip()
        street = str(p.get("Street") or "").strip()
        address = f"{addr_num} {street}".strip().upper()

        neigh = find_neighbourhood(lon, lat) or (str(p.get("Area") or "").strip() or None)
        stats_key = f"victoria:{neigh}" if neigh else "victoria:null"
        color = lookup_tree_color(color_dict, g, s, c)

        processed_trees.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {
                    "asset_id": int(p["OBJECTID"]),
                    "city": "victoria",
                    "address": address,
                    "common_name": cn,
                    "genus_name": g,
                    "species_name": s,
                    "cultivar_name": c,
                    "diameter_cm": diam,
                    "height_m": height,
                    "height_range_id": height_id,
                    "date_planted": None,
                    "neighbourhood_name": neigh,
                    "stats_key": stats_key,
                    "color": color,
                },
            }
        )

    # Stats
    tree_stats: Dict[str, Dict[str, Any]] = {}
    neighborhood_stats: Dict[str, Dict[str, Any]] = {}
    ts_diam_c: Counter = Counter()
    ts_h_c: Counter = Counter()
    ns_diam_c: Counter = Counter()
    ns_h_c: Counter = Counter()

    for feat in processed_trees:
        p = feat["properties"]
        cn = p["common_name"]
        skey = p["stats_key"]
        diam = p["diameter_cm"]
        hid = p["height_range_id"]

        if cn not in tree_stats:
            tree_stats[cn] = {
                "total_count": 0,
                "average_diameter": 0.0,
                "average_height_id": 0,
                "neighborhood_counts": {},
                "color": p["color"],
            }
        ts = tree_stats[cn]
        ts["total_count"] += 1
        if diam is not None:
            ts["average_diameter"] += diam
            ts_diam_c[cn] += 1
        if hid is not None:
            ts["average_height_id"] += hid
            ts_h_c[cn] += 1
        ts["neighborhood_counts"][skey] = ts["neighborhood_counts"].get(skey, 0) + 1

        if skey not in neighborhood_stats:
            neighborhood_stats[skey] = {
                "city": "victoria",
                "name": p["neighbourhood_name"],
                "total_count": 0,
                "average_diameter": 0.0,
                "average_height_id": 0,
            }
        ns = neighborhood_stats[skey]
        ns["total_count"] += 1
        if diam is not None:
            ns["average_diameter"] += diam
            ns_diam_c[skey] += 1
        if hid is not None:
            ns["average_height_id"] += hid
            ns_h_c[skey] += 1

    for cn, ts in tree_stats.items():
        dc, hc = ts_diam_c[cn], ts_h_c[cn]
        ts["average_diameter"] = round(ts["average_diameter"] / dc, 2) if dc else 0.0
        ts["average_height_id"] = round(ts["average_height_id"] / hc) if hc else 0

    for skey, ns in neighborhood_stats.items():
        dc, hc = ns_diam_c[skey], ns_h_c[skey]
        ns["average_diameter"] = round(ns["average_diameter"] / dc, 2) if dc else 0.0
        ns["average_height_id"] = round(ns["average_height_id"] / hc) if hc else 0

    densities: List[float] = []
    for feat in boundaries:
        props = feat["properties"]
        skey = props["stats_key"]
        area = round(geometry_area_sqkm(feat["geometry"]), 4)
        count = neighborhood_stats.get(skey, {}).get("total_count", 0)
        density = round(count / area, 2) if area > 0 else 0.0
        props["area_sqkm"] = area
        props["tree_count"] = count
        props["tree_density_sqkm"] = density
        if skey in neighborhood_stats:
            neighborhood_stats[skey]["area_sqkm"] = area
            neighborhood_stats[skey]["tree_density_sqkm"] = density
        densities.append(density)

    min_d = min(densities) if densities else 0.0
    max_d = max(densities) if densities else 1.0
    span_d = (max_d - min_d) or 1.0
    for feat in boundaries:
        d_val = feat["properties"]["tree_density_sqkm"]
        idx = min(
            len(DENSITY_PALETTE) - 1,
            int(((d_val - min_d) / span_d) * (len(DENSITY_PALETTE) - 1)),
        )
        feat["properties"]["color"] = DENSITY_PALETTE[idx]

    # Taxonomy
    combos: Dict[str, Dict[Tuple[str, str, str], int]] = {}
    for feat in processed_trees:
        p = feat["properties"]
        cn = p["common_name"]
        bucket = combos.setdefault(cn, {})
        key = (p["genus_name"], p["species_name"], p["cultivar_name"])
        bucket[key] = bucket.get(key, 0) + 1

    genera_map: Dict[str, Dict[str, Dict[str, Any]]] = {}
    search_index: Dict[str, List[Dict[str, str]]] = {}
    seen_refs: Dict[str, set] = {}

    for cn, bucket in combos.items():
        st = tree_stats.get(cn, {})
        (g, s, c), _ = max(bucket.items(), key=lambda kv: kv[1])
        genera_map.setdefault(g, {}).setdefault(s, {})[cn] = {
            "common_name": cn,
            "cultivar_name": c,
            "total_count": st.get("total_count", 0),
            "color": st.get("color"),
        }
        for gg, ss, cc in bucket:
            key_common = cn.upper()
            if (gg, ss, cc, cn) not in seen_refs.setdefault(key_common, set()):
                seen_refs[key_common].add((gg, ss, cc, cn))
                search_index.setdefault(key_common, []).append(
                    {"genus": gg, "species": ss, "cultivar_name": cc}
                )
            key_sci = f"{gg} {ss}".upper()
            if (gg, ss, cn) not in seen_refs.setdefault(key_sci, set()):
                seen_refs[key_sci].add((gg, ss, cn))
                search_index.setdefault(key_sci, []).append(
                    {"genus": gg, "species": ss, "cultivar_name": cc, "common_name": cn}
                )

    genera_list = []
    for g, sp_map in genera_map.items():
        sp_list = []
        g_total = 0
        for s, leaves in sp_map.items():
            leaf_list = sorted(leaves.values(), key=lambda x: -x["total_count"])
            s_total = sum(x["total_count"] for x in leaf_list)
            g_total += s_total
            if s == "XX":
                sci = f"{g.title()} \u00d7 hybrid"
            elif s == "SPECIES":
                sci = f"{g.title()} sp."
            else:
                sci = f"{g.title()} {s.lower()}"
            sp_list.append(
                {
                    "species": s,
                    "scientific_name": sci,
                    "total_count": s_total,
                    "common_names": leaf_list,
                }
            )
        sp_list.sort(key=lambda x: -x["total_count"])
        genera_list.append({"genus": g, "total_count": g_total, "species": sp_list})
    genera_list.sort(key=lambda x: -x["total_count"])

    stats_payload = {
        "city_tree_count": len(processed_trees),
        "tree_stats": tree_stats,
        "neighborhood_stats": neighborhood_stats,
        "tree_taxonomy": {"genera": genera_list, "search_index": search_index},
    }

    with open(OUT_BOUNDARIES, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": boundaries}, f)
    with open(OUT_TREES_JSON, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": processed_trees}, f)
    with open(OUT_TREES_LDJSON, "w", encoding="utf-8") as f:
        for feat in processed_trees:
            f.write(json.dumps(feat, separators=(",", ":")) + "\n")
    with open(OUT_STATS, "w", encoding="utf-8") as f:
        json.dump(stats_payload, f)

    db_rows = [
        (
            feat["properties"]["asset_id"],
            feat["geometry"]["coordinates"][0],
            feat["geometry"]["coordinates"][1],
        )
        for feat in processed_trees
    ]
    with sqlite3.connect(OUT_DB) as conn:
        conn.execute("DROP TABLE IF EXISTS trees")
        conn.execute(
            "CREATE TABLE trees ("
            "asset_id INTEGER PRIMARY KEY, "
            "longitude REAL NOT NULL, "
            "latitude REAL NOT NULL)"
        )
        conn.executemany(
            "INSERT INTO trees (asset_id, longitude, latitude) VALUES (?, ?, ?)",
            db_rows,
        )
        conn.commit()

    print(f"Victoria trees: {len(processed_trees):,}")
    print(f"Victoria boundaries: {len(boundaries)}")
    print(f"Stats keys: {len(tree_stats)} common names, {len(neighborhood_stats)} neighbourhoods")


if __name__ == "__main__":
    main()
