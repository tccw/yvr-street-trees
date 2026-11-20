#!/usr/bin/env python3
"""
Merge Vancouver and New Westminster tree & neighbourhood boundary GeoJSONs into
separate test outputs in opendata/processed/ without modifying existing
Vancouver-only files.

Outputs:
- opendata/processed/metro-boundaries-processed.json
- opendata/processed/metro-all-trees-processed.json
- opendata/processed/metro-all-trees-processed-stats.json
- opendata/processed/new-west-unmatched-taxa.csv
"""
import csv
import hashlib
import json
import math
import re
import sqlite3
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parent.parent
OPENDATA = ROOT / "opendata"

VAN_TREES_RAW = OPENDATA / "raw" / "vancouver-all-trees-raw.json"
NW_TREES_RAW = OPENDATA / "raw" / "new-westminster-tree-inventory-active-trees.geojson"
NV_TREES_RAW = OPENDATA / "raw" / "city-of-north-vancouver-trees.geojson"
VAN_BOUNDARIES_PROCESSED = OPENDATA / "processed" / "vancouver-boundaries-processed.json"
NW_BOUNDARIES_RAW = OPENDATA / "raw" / "new-westminster-boundaries-traditional.geojson"
NV_BOUNDARIES_RAW = OPENDATA / "raw" / "city-of-north-vancouver-neighbourhood-boundaries.geojson"
COLOR_DICT_PATH = OPENDATA / "processed" / "assigned-tree-colors-seed5.json"

OUT_BOUNDARIES = OPENDATA / "processed" / "metro-boundaries-processed.json"
OUT_TREES = OPENDATA / "processed" / "metro-all-trees-processed.json"
OUT_STATS = OPENDATA / "processed" / "metro-all-trees-processed-stats.json"
OUT_UNMATCHED_CSV = OPENDATA / "processed" / "new-west-unmatched-taxa.csv"
OUT_NV_UNMATCHED_CSV = OPENDATA / "processed" / "north-van-unmatched-taxa.csv"
OUT_DB = OPENDATA / "processed" / "metro-all-trees-id-to-location-map.db"

NW_ID_OFFSET = 10_000_000
NV_ID_OFFSET = 20_000_000
NV_ID_MOD = 99_980_000_000
FALLBACK_COLOR = "#b0b0b0"
SENTINEL_DATES = {"1899-12-30", "1899-12-31", "1900-01-01", "1970-01-01"}

GENUS_ALIASES = {
    "CLADASTRIS": "CLADRASTIS",
    "OTHER": "UNKNOWN",
    "TO BE DETERMINED": "UNKNOWN",
}

SPECIES_PLACEHOLDERS = {"OTHER", "TO BE DETERMINED", "SPP", "SPP.", "SP", "SP."}

SPECIES_ALIASES = {
    "BABILONICA": "BABYLONICA",
    "RETICULATE": "RETICULATA",
    "LAVALLEEI": "LAVALLEI",
    "PANNICULATA": "PANICULATA",
    "KENTUKEA": "LUTEA",
    "AQUAFOLIUM": "AQUIFOLIUM",
}

PAIR_ALIASES = {
    ("STYRAX", "JAPONICA"): ("STYRAX", "JAPONICUS"),
    ("QUERCUS", "RUBRUM"): ("QUERCUS", "RUBRA"),
}

NW_COMMON_NAME_OVERRIDES = {
    ("PICEA", "SITKENSIS"): "SITKA SPRUCE",
    ("MAGNOLIA", "CYLINDRICA"): "HUANGSHAN MAGNOLIA",
    ("ACER", "RUFINERVE"): "REDVEIN MAPLE",
    ("CORNUS", "FLORIDA X NUTTALLII"): "EDDIE'S WHITE WONDER DOGWOOD",
}

# 10-step ColorBrewer Greens ramp (low density = light green, high density = dark green)
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


def norm_taxon(value: Any, default: str) -> str:
    normalized = re.sub(r"\s+", " ", str(value or "")).strip().upper()
    return normalized or default


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
    for hole in poly_coords[1:]:
        if point_in_ring(lon, lat, hole):
            return False
    return True


def point_in_geometry(lon: float, lat: float, geometry: Dict[str, Any]) -> bool:
    gtype = geometry.get("type")
    coords = geometry.get("coordinates", [])
    if gtype == "Polygon":
        return point_in_polygon(lon, lat, coords)
    if gtype == "MultiPolygon":
        return any(point_in_polygon(lon, lat, poly) for poly in coords)
    return False


def ring_area_sqkm(ring: List[List[float]]) -> float:
    """Approximate geodesic polygon ring area in km^2 using equirectangular projection."""
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
        total = 0.0
        for poly in coords:
            if poly:
                total += ring_area_sqkm(poly[0]) - sum(ring_area_sqkm(h) for h in poly[1:])
        return total
    return 0.0


def geometry_bbox(geometry: Dict[str, Any]) -> Tuple[float, float, float, float]:
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
    return (min(xs), min(ys), max(xs), max(ys)) if xs else (0.0, 0.0, 0.0, 0.0)


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


def build_dissolved_nw_boundaries() -> List[Dict[str, Any]]:
    with open(NW_BOUNDARIES_RAW, "r", encoding="utf-8") as f:
        nw_raw = json.load(f)

    grouped: Dict[str, List[List[List[List[float]]]]] = defaultdict(list)
    seen_polys: Dict[str, set] = defaultdict(set)
    for feat in nw_raw["features"]:
        name = (feat.get("properties", {}).get("NEIGH_NAME") or "").strip()
        if not name:
            continue
        geom = feat["geometry"]
        polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
        for poly in polys:
            sig = (len(poly[0]), round(poly[0][0][0], 6), round(poly[0][0][1], 6)) if poly and poly[0] else None
            if sig and sig in seen_polys[name]:
                continue
            if sig:
                seen_polys[name].add(sig)
            grouped[name].append(poly)

    features = []
    for name, polys in sorted(grouped.items()):
        geom = (
            {"type": "Polygon", "coordinates": polys[0]}
            if len(polys) == 1
            else {"type": "MultiPolygon", "coordinates": polys}
        )
        features.append(
            {
                "type": "Feature",
                "geometry": geom,
                "properties": {
                    "city": "new-westminster",
                    "name": name,
                    "stats_key": f"new-westminster:{name}",
                    "description": [],
                },
            }
        )
    return features


def build_nv_boundaries() -> List[Dict[str, Any]]:
    if not NV_BOUNDARIES_RAW.exists():
        return []
    with open(NV_BOUNDARIES_RAW, "r", encoding="utf-8") as f:
        nv_raw = json.load(f)

    features = []
    for feat in nv_raw.get("features", []):
        p = feat.get("properties") or {}
        name = (p.get("neigh_name") or p.get("name") or "").strip()
        if not name or not feat.get("geometry"):
            continue
        features.append(
            {
                "type": "Feature",
                "geometry": feat["geometry"],
                "properties": {
                    "city": "north-vancouver",
                    "name": name,
                    "stats_key": f"north-vancouver:{name}",
                    "description": [],
                },
            }
        )
    return features


def prepare_boundaries() -> Tuple[List[Dict[str, Any]], Dict[str, List[Tuple[str, Tuple[float, float, float, float], Dict[str, Any]]]]]:
    with open(VAN_BOUNDARIES_PROCESSED, "r", encoding="utf-8") as f:
        van_b = json.load(f)

    combined: List[Dict[str, Any]] = []
    for feat in van_b["features"]:
        props = dict(feat["properties"])
        name = props["name"]
        props["city"] = "vancouver"
        props["stats_key"] = f"vancouver:{name}"
        combined.append(
            {
                "type": "Feature",
                "geometry": feat["geometry"],
                "properties": props,
            }
        )

    combined.extend(build_dissolved_nw_boundaries())
    combined.extend(build_nv_boundaries())

    spatial_index: Dict[
        str, List[Tuple[str, Tuple[float, float, float, float], Dict[str, Any]]]
    ] = defaultdict(list)
    for feat in combined:
        props = feat["properties"]
        spatial_index[props["city"]].append(
            (props["name"], geometry_bbox(feat["geometry"]), feat["geometry"])
        )

    return combined, spatial_index


def assign_neighbourhood(
    city: str,
    lon: float,
    lat: float,
    spatial_index: Dict[str, List[Tuple[str, Tuple[float, float, float, float], Dict[str, Any]]]],
) -> Optional[str]:
    for name, (minx, miny, maxx, maxy), geom in spatial_index[city]:
        if minx <= lon <= maxx and miny <= lat <= maxy:
            if point_in_geometry(lon, lat, geom):
                return name
    return None


def resolve_nw_taxon(
    raw_genus: Any,
    raw_species: Any,
    raw_cultivar: Any,
    van_gsc_map: Dict[Tuple[str, str, str], str],
    van_gs_map: Dict[Tuple[str, str], str],
) -> Tuple[str, str, str, str, bool]:
    """Normalize New West taxon and resolve common_name against Vancouver's inventory."""
    g = norm_taxon(raw_genus, "UNKNOWN")
    g = GENUS_ALIASES.get(g, g)
    s = norm_taxon(raw_species, "SPECIES")
    if s in SPECIES_PLACEHOLDERS:
        s = "SPECIES"
    c = norm_taxon(raw_cultivar, "NONE")

    if (g, s) in PAIR_ALIASES:
        g, s = PAIR_ALIASES[(g, s)]

    # Build candidate species strings to test against Vancouver's taxonomy
    species_candidates: List[str] = [s]
    if s in SPECIES_ALIASES:
        species_candidates.append(SPECIES_ALIASES[s])

    # Hybrid X placement: "X FREEMANII" -> "FREEMANII X", "FREEMANII", "XX"
    for cand in list(species_candidates):
        if cand.startswith("X "):
            base = cand[2:].strip()
            species_candidates.extend([f"{base} X", base, "XX"])
            if base in SPECIES_ALIASES:
                aliased = SPECIES_ALIASES[base]
                species_candidates.extend([f"{aliased} X", aliased])
        elif not cand.endswith(" X") and cand != "SPECIES":
            species_candidates.append(f"{cand} X")

    # Strip VAR. / SUBSP. suffixes, trying both base epithet and varietal epithet
    for cand in list(species_candidates):
        for sep in (" VAR. ", " SUBSP. "):
            if sep in cand:
                head, tail = cand.split(sep, 1)
                species_candidates.extend([tail.strip(), head.strip()])

    # Deduplicate preserving order
    seen = set()
    unique_species = [x for x in species_candidates if not (x in seen or seen.add(x))]

    for sc in unique_species:
        if (g, sc, c) in van_gsc_map:
            return g, sc, c, van_gsc_map[(g, sc, c)], True
    for sc in unique_species:
        if (g, sc) in van_gs_map:
            return g, sc, c, van_gs_map[(g, sc)], True

    if (g, s) in NW_COMMON_NAME_OVERRIDES:
        return g, s, c, NW_COMMON_NAME_OVERRIDES[(g, s)], True

    if g == "UNKNOWN":
        return g, s, c, "UNKNOWN", False
    if s == "SPECIES":
        return g, s, c, g, False
    return g, s, c, f"{g} {s}", False


def main() -> None:
    with open(COLOR_DICT_PATH, "r", encoding="utf-8") as f:
        color_dict = json.load(f)

    boundaries, spatial_index = prepare_boundaries()

    with open(VAN_TREES_RAW, "r", encoding="utf-8") as f:
        van_raw = json.load(f)
    with open(NW_TREES_RAW, "r", encoding="utf-8") as f:
        nw_raw = json.load(f)
    with open(NV_TREES_RAW, "r", encoding="utf-8") as f:
        nv_raw = json.load(f)

    # Build (genus, species, cultivar) and (genus, species) -> common_name lookups from Vancouver
    van_gsc_counts: Dict[Tuple[str, str, str], Counter] = defaultdict(Counter)
    van_gs_counts: Dict[Tuple[str, str], Counter] = defaultdict(Counter)
    van_genus_counts: Counter = Counter()
    van_species_by_genus: Dict[str, Counter] = defaultdict(Counter)
    van_cultivar_by_gs: Dict[Tuple[str, str], Counter] = defaultdict(Counter)
    for feat in van_raw["features"]:
        p = feat["properties"]
        cn = (p.get("common_name") or "").strip()
        if not cn or cn == "PLANTING SITE":
            continue
        g = norm_taxon(p.get("genus_name"), "UNKNOWN")
        s = norm_taxon(p.get("species_name"), "SPECIES")
        c = norm_taxon(p.get("cultivar_name"), "NONE")
        van_gsc_counts[(g, s, c)][cn] += 1
        van_gs_counts[(g, s)][cn] += 1
        van_genus_counts[g] += 1
        van_species_by_genus[g][s] += 1
        if c != "NONE":
            van_cultivar_by_gs[(g, s)][c] += 1

    van_gsc_map = {k: cnt.most_common(1)[0][0] for k, cnt in van_gsc_counts.items()}
    van_gs_map = {k: cnt.most_common(1)[0][0] for k, cnt in van_gs_counts.items()}

    def expand_prefix(val: str, counts: Counter) -> str:
        if len(val) == 10 and val not in counts:
            matches = [(cnt, k) for k, cnt in counts.items() if k.startswith(val)]
            if not matches and val.startswith("X "):
                stem = val[2:].strip()
                matches = [
                    (cnt, k)
                    for k, cnt in counts.items()
                    if k.startswith(stem) or k.startswith(f"{stem}")
                ]
            if matches:
                return max(matches)[1]
        return val

    def infer_genus_from_species(sp: str) -> Optional[Tuple[str, str]]:
        """Deterministically infer (genus, expanded_species) only if every
        matching (genus, species) in Vancouver shares a single unique genus."""
        if not sp or sp in ("SPECIES", "XX"):
            return None
        matches: List[Tuple[int, str, str]] = []
        for g_full, sp_counts in van_species_by_genus.items():
            if g_full == "UNKNOWN":
                continue
            for s_full, cnt in sp_counts.items():
                if s_full in ("SPECIES", "XX"):
                    continue
                if s_full == sp or (len(sp) == 10 and s_full.startswith(sp)):
                    matches.append((cnt, g_full, s_full))
        unique_genera = {m[1] for m in matches}
        if len(unique_genera) == 1:
            _, sole_g, best_s = max(matches)
            return sole_g, best_s
        return None

    merged_features: List[Dict[str, Any]] = []
    unmatched_nw: Counter = Counter()
    unmatched_nv: Counter = Counter()

    # 1. Process Vancouver trees
    for feat in van_raw["features"]:
        p = feat["properties"]
        cn = (p.get("common_name") or "").strip()
        if not cn or cn == "PLANTING SITE":
            continue
        coords = feat["geometry"]["coordinates"]
        lon, lat = coords[0], coords[1]
        g = norm_taxon(p.get("genus_name"), "UNKNOWN")
        s = norm_taxon(p.get("species_name"), "SPECIES")
        c = norm_taxon(p.get("cultivar_name"), "NONE")
        diam = float(p.get("diameter_cm") or 0.0)
        height = float(p.get("height_m") or 0.0)
        height_id = round(height / 3.0)
        neigh = assign_neighbourhood("vancouver", lon, lat, spatial_index)
        stats_key = f"vancouver:{neigh}" if neigh else "vancouver:null"
        color = lookup_tree_color(color_dict, g, s, c)

        merged_features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]},
                "properties": {
                    "asset_id": p["asset_id"],
                    "city": "vancouver",
                    "address": p.get("address") or "",
                    "common_name": cn,
                    "genus_name": g,
                    "species_name": s,
                    "cultivar_name": c,
                    "diameter_cm": diam,
                    "height_m": height,
                    "height_range_id": height_id,
                    "date_planted": p.get("date_planted"),
                    "neighbourhood_name": neigh,
                    "stats_key": stats_key,
                    "color": color,
                },
            }
        )

    # 2. Process New Westminster trees
    for feat in nw_raw["features"]:
        p = feat["properties"]
        coords = feat["geometry"]["coordinates"]
        lon, lat = coords[0], coords[1]
        g, s, c, cn, matched = resolve_nw_taxon(
            p.get("GENUS"), p.get("SPECIES"), p.get("CULTIVAR"), van_gsc_map, van_gs_map
        )
        if not matched:
            unmatched_nw[(g, s, c)] += 1

        diam = float(p.get("DBH") or 0.0)
        height = float(p.get("TREEHEIGHT") or 0.0)
        height_id = round(height / 3.0)
        planted_raw = p.get("PLANTINGDATE")
        date_planted = str(planted_raw)[:10] if planted_raw else None
        neigh = assign_neighbourhood("new-westminster", lon, lat, spatial_index)
        stats_key = f"new-westminster:{neigh}" if neigh else "new-westminster:null"
        color = lookup_tree_color(color_dict, g, s, c)

        merged_features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]},
                "properties": {
                    "asset_id": NW_ID_OFFSET + int(p["objectid"]),
                    "city": "new-westminster",
                    "address": p.get("ADDRESS") or "",
                    "common_name": cn,
                    "genus_name": g,
                    "species_name": s,
                    "cultivar_name": c,
                    "diameter_cm": diam,
                    "height_m": height,
                    "height_range_id": height_id,
                    "date_planted": date_planted,
                    "neighbourhood_name": neigh,
                    "stats_key": stats_key,
                    "color": color,
                },
            }
        )

    # 2b. Process City of North Vancouver trees (collect first so tie-breaking on
    # duplicate coordinates is deterministic regardless of input row order)
    nv_records: List[Tuple[Tuple[Any, ...], Dict[str, Any]]] = []
    for feat in nv_raw["features"]:
        geom = feat.get("geometry")
        if not geom or not geom.get("coordinates"):
            continue
        p = feat["properties"]
        lon, lat = round(geom["coordinates"][0], 6), round(geom["coordinates"][1], 6)
        raw_g = re.sub(r"\s*-\s*.*$", "", str(p.get("GENUS") or "")).strip()
        g_norm = expand_prefix(norm_taxon(raw_g, "UNKNOWN"), van_genus_counts)
        s_raw = norm_taxon(p.get("SPECIES"), "SPECIES")
        if g_norm == "UNKNOWN":
            inferred = infer_genus_from_species(s_raw)
            if inferred:
                g_norm, s_norm = inferred
            else:
                s_norm = s_raw
        else:
            s_norm = expand_prefix(s_raw, van_species_by_genus.get(g_norm, Counter()))
        c_raw = norm_taxon(p.get("VARIETY"), "NONE")
        c_norm = (
            expand_prefix(c_raw, van_cultivar_by_gs.get((g_norm, s_norm), Counter()))
            if c_raw != "NONE"
            else "NONE"
        )

        g, s, c, cn, matched = resolve_nw_taxon(
            g_norm, s_norm, c_norm, van_gsc_map, van_gs_map
        )
        if not matched:
            unmatched_nv[(g, s, c)] += 1

        raw_diam = p.get("DIAMETERcm")
        diam = float(raw_diam) if raw_diam is not None else None
        planted_raw = p.get("PLANT_DATE")
        if planted_raw:
            ps = str(planted_raw).strip()
            if len(ps) == 8 and ps.isdigit():
                date_planted = f"{ps[:4]}-{ps[4:6]}-{ps[6:8]}"
            else:
                date_planted = ps[:10]
            if date_planted in SENTINEL_DATES:
                date_planted = None
        else:
            date_planted = None

        neigh = assign_neighbourhood("north-vancouver", lon, lat, spatial_index)
        stats_key = f"north-vancouver:{neigh}" if neigh else "north-vancouver:null"
        color = lookup_tree_color(color_dict, g, s, c)
        sort_key = (lon, lat, g, s, c, diam if diam is not None else -1.0)
        nv_records.append(
            (
                sort_key,
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [lon, lat]},
                    "properties": {
                        "asset_id": 0,  # populated deterministically below
                        "city": "north-vancouver",
                        "address": "",
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
                    },
                },
            )
        )

    nv_records.sort(key=lambda item: item[0])
    coord_tie_counts: Counter = Counter()
    seen_nv_ids: set = set()
    for (lon, lat, *_), feature in nv_records:
        tie_idx = coord_tie_counts[(lon, lat)]
        coord_tie_counts[(lon, lat)] += 1
        key_str = f"north-vancouver:{lon:.6f},{lat:.6f}#{tie_idx}"
        digest = hashlib.sha256(key_str.encode("utf-8")).digest()
        candidate_id = NV_ID_OFFSET + (int.from_bytes(digest[:5], "big") % NV_ID_MOD)
        while candidate_id in seen_nv_ids:
            candidate_id += 1
        seen_nv_ids.add(candidate_id)
        feature["properties"]["asset_id"] = candidate_id
        merged_features.append(feature)

    # 3. Compute tree_stats & neighborhood_stats (keyed by city:neighbourhood)
    tree_stats: Dict[str, Dict[str, Any]] = {}
    neighborhood_stats: Dict[str, Dict[str, Any]] = {}
    ts_diam_counts: Counter = Counter()
    ts_height_counts: Counter = Counter()
    ns_diam_counts: Counter = Counter()
    ns_height_counts: Counter = Counter()

    for feat in merged_features:
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
            ts_diam_counts[cn] += 1
        if hid is not None:
            ts["average_height_id"] += hid
            ts_height_counts[cn] += 1
        ts["neighborhood_counts"][skey] = ts["neighborhood_counts"].get(skey, 0) + 1

        if skey not in neighborhood_stats:
            neighborhood_stats[skey] = {
                "city": p["city"],
                "name": p["neighbourhood_name"],
                "total_count": 0,
                "average_diameter": 0.0,
                "average_height_id": 0,
            }
        ns = neighborhood_stats[skey]
        ns["total_count"] += 1
        if diam is not None:
            ns["average_diameter"] += diam
            ns_diam_counts[skey] += 1
        if hid is not None:
            ns["average_height_id"] += hid
            ns_height_counts[skey] += 1

    for cn, ts in tree_stats.items():
        dc = ts_diam_counts[cn]
        hc = ts_height_counts[cn]
        ts["average_diameter"] = round(ts["average_diameter"] / dc, 2) if dc else 0.0
        ts["average_height_id"] = round(ts["average_height_id"] / hc) if hc else 0

    for skey, ns in neighborhood_stats.items():
        dc = ns_diam_counts[skey]
        hc = ns_height_counts[skey]
        ns["average_diameter"] = round(ns["average_diameter"] / dc, 2) if dc else 0.0
        ns["average_height_id"] = round(ns["average_height_id"] / hc) if hc else 0

    # 4. Compute boundary areas, densities, and density-based colors
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

    # 5. Compute hierarchical tree_taxonomy
    combos: Dict[str, Dict[Tuple[str, str, str], int]] = {}
    for feat in merged_features:
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
        "city_tree_count": len(merged_features),
        "tree_stats": tree_stats,
        "neighborhood_stats": neighborhood_stats,
        "tree_taxonomy": {"genera": genera_list, "search_index": search_index},
    }

    with open(OUT_BOUNDARIES, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": boundaries}, f)
    with open(OUT_TREES, "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": merged_features}, f)
    with open(OUT_STATS, "w", encoding="utf-8") as f:
        json.dump(stats_payload, f)
    for csv_path, counter in (
        (OUT_UNMATCHED_CSV, unmatched_nw),
        (OUT_NV_UNMATCHED_CSV, unmatched_nv),
    ):
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["count", "genus", "species", "cultivar"])
            for (g, s, c), cnt in counter.most_common():
                writer.writerow([cnt, g, s, c])

    db_rows = [
        (
            feat["properties"]["asset_id"],
            feat["geometry"]["coordinates"][0],
            feat["geometry"]["coordinates"][1],
        )
        for feat in merged_features
        if feat["properties"].get("asset_id") is not None
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

    print(f"Merged trees: {len(merged_features):,}")
    print(f"SQLite DB rows: {len(db_rows):,} -> {OUT_DB}")
    print(f"Merged boundaries: {len(boundaries)} (Vancouver + dissolved New West)")
    print(f"Stats keys: {len(tree_stats)} common names, {len(neighborhood_stats)} neighbourhoods")
    print(f"Unmatched New West taxa: {len(unmatched_nw)} ({sum(unmatched_nw.values()):,} trees)")
    print(f"Unmatched North Van taxa: {len(unmatched_nv)} ({sum(unmatched_nv.values()):,} trees)")


if __name__ == "__main__":
    main()
