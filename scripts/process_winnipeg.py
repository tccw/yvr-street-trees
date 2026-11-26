#!/usr/bin/env python3
"""
Process City of Winnipeg tree inventory (309k+ trees) & neighbourhood
boundaries into runtime data and Mapbox .ldjson.

Streams the 254 MB tree GeoJSON line-by-line to keep memory usage low.

Outputs:
- opendata/processed/winnipeg-trees-processed.ldjson
- public/data/winnipeg-boundaries-processed.json
- public/data/winnipeg-trees-stats.json
- public/data/winnipeg-trees-id-to-location-map.db
"""
import json
import math
import re
import sqlite3
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parent.parent
OPENDATA = ROOT / "opendata"
PUBLIC_DATA = ROOT / "public" / "data"

WPG_TREES_RAW = OPENDATA / "raw" / "winnipeg-tree-inventory_20261122.geojson"
WPG_BOUNDARIES_RAW = OPENDATA / "raw" / "winnipeg-neighbourhood-boundaries_20261122.geojson"
COLOR_DICT_PATH = OPENDATA / "processed" / "assigned-tree-colors-seed5.json"

OUT_TREES_LDJSON = OPENDATA / "processed" / "winnipeg-trees-processed.ldjson"
OUT_BOUNDARIES = PUBLIC_DATA / "winnipeg-boundaries-processed.json"
OUT_STATS = PUBLIC_DATA / "winnipeg-trees-stats.json"
OUT_DB = PUBLIC_DATA / "winnipeg-trees-id-to-location-map.db"

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
        return (0.0, 0.0, 0.0, 0.0), [49.8951, -97.1384]
    bbox = (min(xs), min(ys), max(xs), max(ys))
    return bbox, [round((bbox[1] + bbox[3]) / 2, 6), round((bbox[0] + bbox[2]) / 2, 6)]


def parse_botanical_name(raw: Any) -> Tuple[str, str, str]:
    text = re.sub(r"\s+", " ", str(raw or "")).strip()
    if not text or text.upper() in ("N/A", "UNKNOWN", "NONE", "STUMP", "VACANT"):
        return "UNKNOWN", "SPECIES", "NONE"

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


def format_address(p: Dict[str, Any]) -> str:
    street = str(p.get("street") or "").strip()
    x_from = str(p.get("x_street_from") or "").strip()
    x_to = str(p.get("x_street_to") or "").strip()
    if not street:
        return ""
    if x_from and x_to:
        return f"{street} ({x_from} – {x_to})".upper()
    if x_from or x_to:
        return f"{street} (at {x_from or x_to})".upper()
    return street.upper()


def main() -> None:
    PUBLIC_DATA.mkdir(parents=True, exist_ok=True)
    with open(COLOR_DICT_PATH, "r", encoding="utf-8") as f:
        color_dict = json.load(f)
    with open(WPG_BOUNDARIES_RAW, "r", encoding="utf-8") as f:
        wpg_b_raw = json.load(f)

    boundaries: List[Dict[str, Any]] = []
    spatial_index: List[Tuple[str, Tuple[float, float, float, float], Dict[str, Any]]] = []
    name_upper_map: Dict[str, str] = {}

    for feat in wpg_b_raw.get("features", []):
        p = feat.get("properties") or {}
        name = (p.get("name") or "").strip()
        geom = feat.get("geometry")
        if not name or not geom:
            continue
        bbox, center_lat_lon = geometry_bbox_and_center(geom)
        spatial_index.append((name, bbox, geom))
        name_upper_map[name.upper()] = name
        boundaries.append(
            {
                "type": "Feature",
                "geometry": geom,
                "properties": {
                    "city": "winnipeg",
                    "name": name,
                    "stats_key": f"winnipeg:{name}",
                    "geo_point_2d": center_lat_lon,
                    "description": [],
                },
            }
        )

    def find_neighbourhood(lon: float, lat: float, raw_neigh: str) -> Optional[str]:
        if raw_neigh and raw_neigh.upper() in name_upper_map:
            return name_upper_map[raw_neigh.upper()]
        for name, (minx, miny, maxx, maxy), geom in spatial_index:
            if minx <= lon <= maxx and miny <= lat <= maxy:
                if point_in_geometry(lon, lat, geom):
                    return name
        return None

    tree_stats: Dict[str, Dict[str, Any]] = {}
    neighborhood_stats: Dict[str, Dict[str, Any]] = {}
    ts_diam_c: Counter = Counter()
    ns_diam_c: Counter = Counter()
    combos: Dict[str, Dict[Tuple[str, str, str], int]] = {}
    db_rows: List[Tuple[int, float, float]] = []
    total_trees = 0

    with open(WPG_TREES_RAW, "r", encoding="utf-8") as src, open(
        OUT_TREES_LDJSON, "w", encoding="utf-8"
    ) as ldjson_out:
        for line in src:
            s_line = line.strip()
            if not s_line.startswith('{"type":"Feature"'):
                continue
            if s_line.endswith(","):
                s_line = s_line[:-1]
            feat = json.loads(s_line)
            geom = feat.get("geometry")
            if not geom or not geom.get("coordinates"):
                continue
            p = feat.get("properties") or {}
            raw_id = p.get("tree_id")
            if raw_id is None:
                continue
            asset_id = int(raw_id)
            lon, lat = round(geom["coordinates"][0], 6), round(geom["coordinates"][1], 6)

            g, s, c = parse_botanical_name(p.get("botanical_name"))
            raw_cn = re.sub(r"\s+", " ", str(p.get("common_name") or "")).strip().upper()
            if not raw_cn or raw_cn in ("N/A", "UNKNOWN"):
                cn = "UNKNOWN" if g == "UNKNOWN" else (f"{g} {s}" if s != "SPECIES" else g)
            else:
                cn = raw_cn

            diam = safe_positive_float(p.get("diameter_at_breast_height"))
            planted_raw = p.get("planting_date")
            date_planted = str(planted_raw)[:10] if planted_raw else None
            address = format_address(p)
            raw_neigh = str(p.get("neighbourhood") or "").strip()
            neigh = find_neighbourhood(lon, lat, raw_neigh)
            stats_key = f"winnipeg:{neigh}" if neigh else "winnipeg:null"
            color = lookup_tree_color(color_dict, g, s, c)
            ded_tag = str(p.get("ded_tag_number")).strip() if p.get("ded_tag_number") else None

            props: Dict[str, Any] = {
                "asset_id": asset_id,
                "city": "winnipeg",
                "address": address,
                "common_name": cn,
                "genus_name": g,
                "species_name": s,
                "cultivar_name": c,
                "diameter_cm": diam,
                "height_m": None,
                "height_range_id": None,
                "date_planted": date_planted,
                "neighbourhood_name": neigh,
                "stats_key": stats_key,
                "color": color,
            }
            if ded_tag:
                props["ded_tag_number"] = ded_tag

            out_feat = {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": props,
            }
            ldjson_out.write(json.dumps(out_feat, separators=(",", ":")) + "\n")
            db_rows.append((asset_id, lon, lat))
            total_trees += 1

            # Aggregate stats
            if cn not in tree_stats:
                tree_stats[cn] = {
                    "total_count": 0,
                    "average_diameter": 0.0,
                    "average_height_id": 0,
                    "neighborhood_counts": {},
                    "color": color,
                }
            ts = tree_stats[cn]
            ts["total_count"] += 1
            if diam is not None:
                ts["average_diameter"] += diam
                ts_diam_c[cn] += 1
            ts["neighborhood_counts"][stats_key] = (
                ts["neighborhood_counts"].get(stats_key, 0) + 1
            )

            if stats_key not in neighborhood_stats:
                neighborhood_stats[stats_key] = {
                    "city": "winnipeg",
                    "name": neigh,
                    "total_count": 0,
                    "average_diameter": 0.0,
                    "average_height_id": 0,
                }
            ns = neighborhood_stats[stats_key]
            ns["total_count"] += 1
            if diam is not None:
                ns["average_diameter"] += diam
                ns_diam_c[stats_key] += 1

            bucket = combos.setdefault(cn, {})
            key = (g, s, c)
            bucket[key] = bucket.get(key, 0) + 1

    for cn, ts in tree_stats.items():
        dc = ts_diam_c[cn]
        ts["average_diameter"] = round(ts["average_diameter"] / dc, 2) if dc else 0.0

    for skey, ns in neighborhood_stats.items():
        dc = ns_diam_c[skey]
        ns["average_diameter"] = round(ns["average_diameter"] / dc, 2) if dc else 0.0

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

    sorted_d = sorted(densities)
    min_d = sorted_d[0] if sorted_d else 0.0
    # Clamp upper end at p98 so extreme park outliers (e.g. Kildonan Park) don't compress the rest of the city
    max_d = sorted_d[int(0.98 * (len(sorted_d) - 1))] if sorted_d else 1.0
    span_d = (max_d - min_d) or 1.0
    for feat in boundaries:
        d_val = feat["properties"]["tree_density_sqkm"]
        t = max(0.0, min(1.0, (d_val - min_d) / span_d))
        idx = min(
            len(DENSITY_PALETTE) - 1,
            int(t * (len(DENSITY_PALETTE) - 1)),
        )
        feat["properties"]["color"] = DENSITY_PALETTE[idx]

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
        "city_tree_count": total_trees,
        "tree_stats": tree_stats,
        "neighborhood_stats": neighborhood_stats,
        "tree_taxonomy": {"genera": genera_list, "search_index": search_index},
    }

    with open(OUT_BOUNDARIES, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": boundaries}, f)
    with open(OUT_STATS, "w", encoding="utf-8") as f:
        json.dump(stats_payload, f)

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

    print(f"Winnipeg trees: {total_trees:,}")
    print(f"Winnipeg boundaries: {len(boundaries)}")
    print(f"Stats keys: {len(tree_stats)} common names, {len(neighborhood_stats)} neighbourhoods")


if __name__ == "__main__":
    main()
