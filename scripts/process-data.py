#!/usr/bin/env python3
"""
Process street tree and boundary GeoJSON datasets.

This CLI supports three workflows:
- create: build processed GeoJSON outputs, optionally renaming/removing properties,
  reducing geometry precision, generating or assigning colors, and emitting stats.
- info: inspect datasets (quick stats, nth feature, counts, first occurrence).
- table: print helpful reference tables (e.g., coordinate precision by latitude).

Dataset keys:
- van-tree | nw-tree for tree point data
- van-bound | nw-bound for boundary polygon data

Notes:
- Tree processing expects properties like common_name, genus_name, species_name,
  cultivar_name, diameter, height_range_id, and neighbourhood_name.
- When -s/--stats is used, a "-stats" JSON file is written alongside the
  output file. For tree data, stats can also drive color assignment.
"""
import argparse
import logging
import sys
import json
import subprocess
import math
import re
from enum import StrEnum
import numpy as np
from skimage import color
from numpy import save
from pylab import cm, matplotlib
from typing import List, Dict, Tuple
from random import randint
from pygments import highlight, lexers, formatters
import traceback

from shapely.geometry import Polygon, Point, shape
from shapely.ops import transform
from shapely.strtree import STRtree
from pyproj import Transformer


# Example usage
"""
# Create processed tree data with renamed/excluded fields and reduced precision
./process-data.py create \
    -n nw-tree \
    -o ../opendata/processed/new-westminster-trees-merged-processed.json \
    -rn '{
            "NEIGH_NAME": "neighborhood_name",
            "Genus": "genus_name",
            "Species": "species_name",
            "Common_Name": "common_name",
            "Cultivar": "cultivar_name",
            "Scientific_Name": "scientific_name"}' \
    -rp 5 \
    -x Location_Type SIDE X Y

# Create processed Vancouver tree data + stats, and assign colors from a dictionary
./process-data.py create \
    -n van-tree \
    -o ../opendata/processed/vancouver-all-trees-processed-seed5.json \
    -x std_street root_barrier street_side_name plant_area curb \
    -s -ss 5 \
    -ac ../opendata/processed/assigned-tree-colors-seed5.json

# Generate a new genus/species/cultivar color dictionary from a list of hex colors
# (use -ss for repeatable color generation)
./process-data.py create \
    -n van-tree \
    -o ../opendata/processed/vancouver-all-trees-processed-seed5.json \
    -x std_street root_barrier street_side_name plant_area curb \
    -s -ss 5 \
    -gc ../opendata/color_list.json

# Boundary processing with a colormap for tree-count shading
./process-data.py create \
    -n van-bound \
    -o ../opendata/processed/vancouver-boundaries-processed.json \
    -s -cmap YlGnBu

# Inspect a dataset with quick stats and property counts
./process-data.py info -n van-tree -qs
./process-data.py info -i ../opendata/processed/vancouver-all-trees-processed-seed5.json -cfw '{"common_name": "Maple"}'

# Print a decimal precision reference table at a latitude
./process-data.py table -pal 49.2827

# Plot genus/species/cultivar colors in 3D LAB space
./process-data.py plot-lab -i ../opendata/processed/genus_species_cultivar_colors.json

# Plot with custom title and capped points per genus
./process-data.py plot-lab -i ../opendata/processed/genus_species_cultivar_colors.json \
    --title 'Vancouver Tree Color Distribution (LAB)' \
    --max-cultivars-per-genus 16
"""

# ---- Constants ----
file_paths = {
    'van-tree': '../opendata/raw/vancouver-all-trees-raw.json',
    # 'van-tree': '../opendata/processed/vancouver-all-trees-processed-randomseed5.json',
    'nw-tree': '../opendata/raw/new-westminster-trees-merged.json',
    'van-bound': '../opendata/raw/vancouver-boundaries-raw.json',
    'nw-bound': '../opendata/raw/new-westminster-boundaries-raw.json'
}

# ---- Key Enums ----
# Use StrEnum so that enum members are also plain str instances and work directly
# as dictionary keys (e.g. d[GeoJsonKey.FEATURES] == d['features']).

class GeoJsonKey(StrEnum):
    """Top-level and geometry keys used in GeoJSON feature collections."""
    FEATURES = 'features'
    PROPERTIES = 'properties'
    GEOMETRY = 'geometry'
    COORDINATES = 'coordinates'
    TYPE = 'type'


class GeoJsonGeomType(StrEnum):
    """Geometry type strings found in the 'type' field of GeoJSON geometries."""
    POINT = 'Point'
    POLYGON = 'Polygon'
    NULL_GEOM = 'null_geom'  # synthetic key used in quick_stats output


class TreePropKey(StrEnum):
    """Property field names found on tree features."""
    COMMON_NAME = 'common_name'
    GENUS_NAME = 'genus_name'
    SPECIES_NAME = 'species_name'
    CULTIVAR_NAME = 'cultivar_name'
    NEIGHBOURHOOD_NAME = 'neighbourhood_name'
    DIAMETER = 'diameter_cm'
    HEIGHT_RANGE_ID = 'height_m'
    COLOR = 'color'


class BoundaryPropKey(StrEnum):
    """Property field names found on boundary features."""
    NAME = 'name'
    TREE_COUNT = 'tree_count'
    COLOR = 'color'
    DESCRIPTION = 'description'


class ColorMapKey(StrEnum):
    """Keys used in the genus/species/cultivar color-map JSON."""
    COLOR = 'color'
    SPECIES = 'species'
    CULTIVARS = 'cultivars'


class StatsKey(StrEnum):
    """Keys used in the stats output JSON."""
    CITY_TREE_COUNT = 'city_tree_count'
    TREE_STATS = 'tree_stats'
    NEIGHBORHOOD_STATS = 'neighborhood_stats'
    TOTAL_COUNT = 'total_count'
    AVERAGE_DIAMETER = 'average_diameter'
    AVERAGE_HEIGHT_ID = 'average_height_id'
    NEIGHBORHOOD_COUNTS = 'neighborhood_counts'


# sentinel string matched against common_name to skip planting-site entries
_PLANTING_SITE = 'PLANTING SITE'


# ---- Local Classes ----
class Color:
    def __init__(self, hex_color: str) -> None:
        self.hex_color = hex_color.lower()
        self.rgb_color = self._hex2rgb(hex_color)

    def similar_color(self, deltaE: int) -> str:  # hex color
        # This doesn't seem to produce colors with exactly the same deltaE when checking with
        # 3rd party tools. Should look into it more.

        # center of the sphere
        center = self.as_lab()

        #TODO: this is broken
        # generate a unit vector using three standard normal random variables
        unit_vector: np.ndarray = np.random.randn(3)
        norm: float = np.linalg.norm(unit_vector)
        unit_vector: np.ndarray = unit_vector / norm

        # scale and shift the vector so that it is centered at Lab space center, and has magnitude deltaE
        scaled_vector: np.ndarray = (unit_vector * deltaE) + center
        L, a, b = scaled_vector
        L = 0 if L < 0 else (100 if L > 100 else L)
        a = -128 if a < -128 else (128 if a > 128 else a)
        b = -128 if b < -128 else (128 if b > 128 else b)

        return matplotlib.colors.rgb2hex(color.lab2rgb((L, a, b)))

    def as_lab(self):
        return color.rgb2lab(self.rgb_color)

    def as_hex(self) -> str:
        return self.hex_color

    @staticmethod
    def _hex2rgb(hex_color: str) -> Tuple[int, int, int]:
        # ignores any alpha information
        return (int(f'0x{hex_color[1:3]}', 0) / 256,
                int(f'0x{hex_color[3:5]}', 0) / 256,
                int(f'0x{hex_color[5:7]}', 0) / 256)


# ----- Helpers -----
def loadjson(filename: str) -> Dict[str, any]:
    with open(filename) as file:
        return json.load(file)


def savejson(filename: str, data) -> None:
    with open(filename, 'w') as file:
        json.dump(data, file)


def choose_color(count: int, bands: List[float], colors: Dict[str, str]) -> str:
    retcol: str = colors[len(colors) - 1]
    for i in range(len(colors)):
        if count <= bands[i]:
            retcol = colors[i]
            break

    return retcol


def polygon_area_sqkm(coordinates) -> float:
    """
    Compute area of a GeoJSON polygon ring in square kilometres.
    Reprojects from WGS84 (EPSG:4326) to BC Albers (EPSG:3005) for accuracy.
    """
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:3005", always_xy=True)
    polygon = Polygon(coordinates[0])  # outer ring only
    projected = transform(transformer.transform, polygon)
    return projected.area / 1_000_000  # m² → km²


def process_trees(args: object):
    data: Dict[str, any] = loadjson(file_paths[args.name])

    # Filter out planting site entries
    data[GeoJsonKey.FEATURES] = [
        entry for entry in data[GeoJsonKey.FEATURES]
        if entry[GeoJsonKey.PROPERTIES][TreePropKey.COMMON_NAME] != _PLANTING_SITE
    ]

    if args.reduce_precision:
        data = reduce_precision(data, args.reduce_precision)
    if args.exclude:
        data = exlude_keys(data, args.exclude)
    if args.rename_properties:
        data = rename_prop_keys(data, args.rename_properties)
    if args.assign_neighbourhoods:
        if args.name != 'van-tree':
            logging.warning('--assign-neighbourhoods is only supported for van-tree; skipping.')
        else:
            boundaries = loadjson(file_paths['van-bound'])
            data = assign_neighbourhoods(data, boundaries)
    color_dict = None

    # Step 1: Get colors (either generate or load from file)
    if args.generate_colors:
        if args.assign_colors:
            logging.warning('-gc and -ac were both provided; ignoring -ac and using the generated color map.')
        hex_color_list: List[str] = loadjson(args.generate_colors)
        color_dict = generate_genus_list(data, hex_color_list)
    elif args.assign_colors:
        color_dict = loadjson(args.assign_colors)

    # Step 2: Assign colors if we have them
    if color_dict:
        if args.stats:
            # Full stats calculation (also saves stats file)
            stats: Dict[str, any] = calc_stats(data, args.outfile, color_dict)
            data = assign_colors_all_trees(data, stats[StatsKey.TREE_STATS])
        else:
            # Calculate just enough stats to assign colors (no stats file written)
            tree_stats = _calc_tree_stats(data, color_dict)
            data = assign_colors_all_trees(data, tree_stats)

    savejson(args.outfile, data)


def process_boundaries(args: object):
    data: Dict[str, any] = loadjson(file_paths[args.name])
    if args.reduce_precision:
        data = reduce_precision(data, args.reduce_precision)
    if args.stats:
        data = color_by_tree_density(data, args)

    savejson(args.outfile, data)


# TODO:
def color_by_tree_count(data: Dict[str, any], args: object) -> Dict[str, any]:
    color_bands: List[str] = get_boundary_colors(10, args.cmap)
    stats: Dict[str, any] = loadjson('../opendata/processed/vancouver-all-trees-processed-seed5-stats.json')[StatsKey.NEIGHBORHOOD_STATS]  # HC'd for now...
    descriptions: Dict[str, List[str]] = loadjson('../opendata/raw/tmp/neighborhood_descriptions.json')
    descriptions = {k.upper(): v for k, v in descriptions.items()}
    counts: List[int] = [neighborhood[StatsKey.TOTAL_COUNT] for neighborhood in stats.values()]
    counts.sort()
    lower_bounds = [counts[0] + ((counts[-1] - counts[0]) / len(color_bands)) * i for i in range(len(color_bands))]

    for boundary in data[GeoJsonKey.FEATURES]:  # O(mn) bad times man (in this case 22^2 operations...)
        for place in list(stats.keys()):
            if boundary[GeoJsonKey.PROPERTIES][BoundaryPropKey.NAME].upper() == place:
                boundary[GeoJsonKey.PROPERTIES][BoundaryPropKey.TREE_COUNT] = stats[place][StatsKey.TOTAL_COUNT]
                boundary[GeoJsonKey.PROPERTIES][BoundaryPropKey.COLOR] = choose_color(stats[place][StatsKey.TOTAL_COUNT], lower_bounds, color_bands)
                boundary[GeoJsonKey.PROPERTIES][BoundaryPropKey.DESCRIPTION] = descriptions[place]

    return data


def color_by_tree_density(data: Dict[str, any], args: object) -> Dict[str, any]:
    """
    Assign fill colors to boundary features based on tree density (trees/km²)
    rather than raw tree count. color_by_tree_count() is left intact.

    Also updates the neighborhood_stats in both stats JSON files to include
    area_sqkm and tree_density_sqkm for each neighbourhood.
    """
    color_bands: List[str] = get_boundary_colors(10, args.cmap)

    # Paths to both stats files (seed5 is the authoritative one read by the app)
    stats_paths = [
        '../opendata/processed/vancouver-all-trees-processed-seed5-stats.json',
        '../opendata/processed/vancouver-all-trees-processed-stats.json',
    ]
    seed5_full = loadjson(stats_paths[0])
    neighborhood_stats: Dict[str, any] = seed5_full[StatsKey.NEIGHBORHOOD_STATS]

    # Build a case-insensitive lookup: uppercase key → original mixed-case key
    stats_upper_lookup: Dict[str, str] = {k.upper(): k for k in neighborhood_stats.keys()}

    # Load descriptions from the existing processed boundaries file (keyed by name, uppercased)
    descriptions: Dict[str, List[str]] = {}
    try:
        existing_processed = loadjson(args.outfile)
        for feat in existing_processed[GeoJsonKey.FEATURES]:
            feat_name = feat[GeoJsonKey.PROPERTIES].get(BoundaryPropKey.NAME, '')
            feat_desc = feat[GeoJsonKey.PROPERTIES].get(BoundaryPropKey.DESCRIPTION, [])
            if feat_name:
                descriptions[feat_name.upper()] = feat_desc
    except (FileNotFoundError, KeyError):
        logging.warning('Could not load descriptions from existing processed boundaries; descriptions will be empty.')

    # First pass: compute area and density for every boundary feature
    area_by_name: Dict[str, float] = {}
    density_by_name: Dict[str, float] = {}

    for boundary in data[GeoJsonKey.FEATURES]:
        props = boundary[GeoJsonKey.PROPERTIES]
        name_upper = props[BoundaryPropKey.NAME].upper()

        if name_upper == 'NULL' or name_upper not in stats_upper_lookup:
            continue

        stats_key = stats_upper_lookup[name_upper]  # original mixed-case key
        coords = boundary[GeoJsonKey.GEOMETRY][GeoJsonKey.COORDINATES]
        area_sqkm = round(polygon_area_sqkm(coords), 2)
        total_count = neighborhood_stats[stats_key][StatsKey.TOTAL_COUNT]
        density = round(total_count / area_sqkm, 1) if area_sqkm > 0 else 0.0

        area_by_name[name_upper] = area_sqkm
        density_by_name[name_upper] = density

        # Store on boundary feature properties
        props[BoundaryPropKey.TREE_COUNT] = total_count
        props['area_sqkm'] = area_sqkm
        props['tree_density_sqkm'] = density
        props[BoundaryPropKey.DESCRIPTION] = descriptions.get(name_upper, [])

    # Build color bands from density distribution (skip "null" neighbourhood)
    densities = sorted(density_by_name.values())
    if densities:
        d_min, d_max = densities[0], densities[-1]
        lower_bounds = [d_min + ((d_max - d_min) / len(color_bands)) * i for i in range(len(color_bands))]
    else:
        lower_bounds = [0] * len(color_bands)

    # Second pass: assign color based on density
    for boundary in data[GeoJsonKey.FEATURES]:
        props = boundary[GeoJsonKey.PROPERTIES]
        name_upper = props[BoundaryPropKey.NAME].upper()
        if name_upper in density_by_name:
            props[BoundaryPropKey.COLOR] = choose_color(density_by_name[name_upper], lower_bounds, color_bands)

    # Persist area/density back into both stats files
    for stats_path in stats_paths:
        try:
            full_stats = loadjson(stats_path)
            file_upper_lookup = {k.upper(): k for k in full_stats[StatsKey.NEIGHBORHOOD_STATS].keys()}
            for name_upper, area_sqkm in area_by_name.items():
                orig_key = file_upper_lookup.get(name_upper)
                if orig_key is not None:
                    full_stats[StatsKey.NEIGHBORHOOD_STATS][orig_key]['area_sqkm'] = area_sqkm
                    full_stats[StatsKey.NEIGHBORHOOD_STATS][orig_key]['tree_density_sqkm'] = density_by_name[name_upper]
            savejson(stats_path, full_stats)
            logging.info('Updated stats with area/density: %s', stats_path)
        except FileNotFoundError:
            logging.warning('Stats file not found, skipping update: %s', stats_path)

    return data


def assign_colors_all_trees(json_data: Dict[str, any], tree_stats: Dict[str, any]) -> Dict[str, any]:
    print()
    for entry in json_data[GeoJsonKey.FEATURES]:
        properties = entry[GeoJsonKey.PROPERTIES]
        common_name = properties[TreePropKey.COMMON_NAME]
        properties[TreePropKey.COLOR] = tree_stats[common_name][TreePropKey.COLOR]

    return json_data


# TODO: remove this function if Tilequery API works out
def calc_stats(json_data: json, outfile: str, color_dict: Dict[str, str]) -> Dict[str, any]:
    """
    Constructs a dictionary with neighborhood tree counts for stats displays.
    The returned dict is of the form:

    {
        "city_tree_count": <total count of trees on map>,
        "tree_stats": {
            <tree common name> : {
                "total_count": <tree count for this species in the city>,
                "average_diameter": float,
                "average_height_id": int,
                "color": <hex color>,
                "neighborhood_counts": {
                    <neighborhood_name> : <tree count in specific neighborhood>,
                    <...other entries>
                }
            }
        "neighborhood_stats": {
            <neighborhood name> : {
                "total_count": <total tree count>,
                "average_diameter": float,
                "average_height": int
                }
            <...other entries>
            }
        }
    }

    """
    stats_outfile = f"{outfile[:outfile.rfind('.')]}-stats{outfile[outfile.rfind('.'):]}"
    stats = {
        StatsKey.CITY_TREE_COUNT: len(json_data[GeoJsonKey.FEATURES]),
        StatsKey.TREE_STATS: _calc_tree_stats(json_data, color_dict),
        StatsKey.NEIGHBORHOOD_STATS: _calc_neighborhood_stats(json_data)
    }
    savejson(stats_outfile, stats)

    return stats


def _calc_tree_stats(json_data: Dict[str, any], color_dict: Dict[str, str]):
    tree_stats = {}
    for entry in json_data[GeoJsonKey.FEATURES]:
        props = entry[GeoJsonKey.PROPERTIES]
        neighbourhood_name = props[TreePropKey.NEIGHBOURHOOD_NAME]
        common_name = props[TreePropKey.COMMON_NAME]
        genus_name = props[TreePropKey.GENUS_NAME]
        species_name = props[TreePropKey.SPECIES_NAME]
        cultivar_name = props.get(TreePropKey.CULTIVAR_NAME)

        # if the tree is already in the object count the tree, else add the new tree name to the object
        if common_name in tree_stats:
            tree_stats[common_name][StatsKey.TOTAL_COUNT] += 1
            tree_stats[common_name][StatsKey.AVERAGE_DIAMETER] += props[TreePropKey.DIAMETER]  # will be the sum until the end
            tree_stats[common_name][StatsKey.AVERAGE_HEIGHT_ID] += props[TreePropKey.HEIGHT_RANGE_ID]
            # if the neighborhood the tree is in has already been added, add the tree to that neighborhood count
            if neighbourhood_name in tree_stats[common_name][StatsKey.NEIGHBORHOOD_COUNTS]:
                tree_stats[common_name][StatsKey.NEIGHBORHOOD_COUNTS][neighbourhood_name] += 1
            # else add the neighborhood to the neighborhood_counts object
            else:
                tree_stats[common_name][StatsKey.NEIGHBORHOOD_COUNTS][neighbourhood_name] = 1
        else:
            try:
                tree_color: str = (
                    color_dict[genus_name][ColorMapKey.SPECIES][species_name][ColorMapKey.CULTIVARS][cultivar_name]
                    if cultivar_name
                    else color_dict[genus_name][ColorMapKey.SPECIES][species_name][ColorMapKey.COLOR]
                )
            except KeyError:
                tree_color: str = color_dict[genus_name][ColorMapKey.SPECIES][species_name][ColorMapKey.COLOR]

            tree_stats[common_name] = {
                StatsKey.TOTAL_COUNT: 1,
                StatsKey.AVERAGE_DIAMETER: props[TreePropKey.DIAMETER],
                StatsKey.AVERAGE_HEIGHT_ID: props[TreePropKey.HEIGHT_RANGE_ID],
                StatsKey.NEIGHBORHOOD_COUNTS: {
                    neighbourhood_name: 1
                },
                TreePropKey.COLOR: tree_color
            }
    # make the averages actual averages
    for k in tree_stats.keys():
        tree_stats[k][StatsKey.AVERAGE_DIAMETER] = round(tree_stats[k][StatsKey.AVERAGE_DIAMETER] / tree_stats[k][StatsKey.TOTAL_COUNT], 2)
        tree_stats[k][StatsKey.AVERAGE_HEIGHT_ID] = round(tree_stats[k][StatsKey.AVERAGE_HEIGHT_ID] / tree_stats[k][StatsKey.TOTAL_COUNT])

    return tree_stats


def _calc_neighborhood_stats(json_data: Dict[str, any]):
    neighborhood_stats = {}

    for entry in json_data[GeoJsonKey.FEATURES]:
        props = entry[GeoJsonKey.PROPERTIES]
        neighbourhood_name = props[TreePropKey.NEIGHBOURHOOD_NAME]
        if neighbourhood_name in neighborhood_stats:
            neighborhood_stats[neighbourhood_name][StatsKey.TOTAL_COUNT] += 1
            neighborhood_stats[neighbourhood_name][StatsKey.AVERAGE_DIAMETER] += props[TreePropKey.DIAMETER]
            neighborhood_stats[neighbourhood_name][StatsKey.AVERAGE_HEIGHT_ID] += props[TreePropKey.HEIGHT_RANGE_ID]
        else:
            neighborhood_stats[neighbourhood_name] = {
                StatsKey.TOTAL_COUNT: 1,
                StatsKey.AVERAGE_DIAMETER: props[TreePropKey.DIAMETER],
                StatsKey.AVERAGE_HEIGHT_ID: props[TreePropKey.HEIGHT_RANGE_ID]
            }

    for k in neighborhood_stats.keys():
        neighborhood_stats[k][StatsKey.AVERAGE_DIAMETER] = round(neighborhood_stats[k][StatsKey.AVERAGE_DIAMETER] / neighborhood_stats[k][StatsKey.TOTAL_COUNT], 2)
        neighborhood_stats[k][StatsKey.AVERAGE_HEIGHT_ID] = round(neighborhood_stats[k][StatsKey.AVERAGE_HEIGHT_ID] / neighborhood_stats[k][StatsKey.TOTAL_COUNT])

    return neighborhood_stats


def rename_prop_keys(json_data: Dict[str, any], swap_json) -> Dict[str, any]:
    """
        Change the name of any property keys
    """
    for entry in json_data[GeoJsonKey.FEATURES]:
        for old_key, new_key in swap_json.items():
            if old_key in entry[GeoJsonKey.PROPERTIES]:
                value = entry[GeoJsonKey.PROPERTIES].pop(old_key)
                entry[GeoJsonKey.PROPERTIES][new_key] = value

    return json_data


def keys_to_upper(json_data: Dict[str, any]) -> Dict[str, any]:
    for entry in json_data[GeoJsonKey.FEATURES]:
        entry[GeoJsonKey.PROPERTIES] = {k.upper(): v for k, v in entry[GeoJsonKey.PROPERTIES].items()}

    return json_data


def keys_to_lower(json_data: Dict[str, any]) -> Dict[str, any]:
    for entry in json_data[GeoJsonKey.FEATURES]:
        entry[GeoJsonKey.PROPERTIES] = {k.lower(): v for k, v in entry[GeoJsonKey.PROPERTIES].items()}

    return json_data


def exlude_keys(json_data: Dict[str, any], exlude_keys: List[str]):
    for entry in json_data[GeoJsonKey.FEATURES]:
        for ex_key in exlude_keys:
            if ex_key in entry[GeoJsonKey.PROPERTIES]:
                entry[GeoJsonKey.PROPERTIES].pop(ex_key)

    return json_data


def generate_genus_list(json_data: Dict[str, Dict[str, str]], hex_color_list: List[str]) -> Dict[str, any]:
    species_delta_e = 18
    cultivar_delta_e = 7
    output_dict = {}
    for entry in json_data[GeoJsonKey.FEATURES]:
        props = entry[GeoJsonKey.PROPERTIES]
        genus_name = props[TreePropKey.GENUS_NAME]
        species_name = props[TreePropKey.SPECIES_NAME]
        cultivar_name = props.get(TreePropKey.CULTIVAR_NAME)

        if genus_name not in output_dict:
            base_color: Color = Color(hex_color_list[np.random.randint(0, len(hex_color_list) - 1)])
            species_color: Color = Color(base_color.similar_color(deltaE=species_delta_e))
            output_dict[genus_name] = {
                ColorMapKey.COLOR: base_color.as_hex(),
                ColorMapKey.SPECIES: {
                    species_name: {
                        ColorMapKey.COLOR: species_color.as_hex(),
                        ColorMapKey.CULTIVARS: {
                            cultivar_name: species_color.similar_color(deltaE=cultivar_delta_e)
                        } if cultivar_name else {}
                    }
                }
            }

        else:
            if species_name not in output_dict[genus_name][ColorMapKey.SPECIES]:
                output_dict[genus_name][ColorMapKey.SPECIES][species_name] = {
                    ColorMapKey.COLOR: Color(output_dict[genus_name][ColorMapKey.COLOR]).similar_color(deltaE=species_delta_e),
                    ColorMapKey.CULTIVARS: {}
                }
            elif cultivar_name:
                output_dict[genus_name][ColorMapKey.SPECIES][species_name][ColorMapKey.CULTIVARS][cultivar_name] = (
                    Color(output_dict[genus_name][ColorMapKey.SPECIES][species_name][ColorMapKey.COLOR])
                    .similar_color(deltaE=cultivar_delta_e)
                )

    savejson('../opendata/processed/assigned-tree-colors-seed5.json', output_dict)
    return output_dict


# reduce precision without expanding if already below
def reduce_precision(json_data: Dict[str, any], decimals: int) -> Dict[str, any]:
    # checking each feature type seems redundant but the GeoJSON spec allows
    # for multiple types in the same feature list
    round_list = lambda pair: [round(coord, decimals) for coord in pair] if pair is not None else pair

    for entry in json_data[GeoJsonKey.FEATURES]:
        geometry_type: str = entry[GeoJsonKey.GEOMETRY][GeoJsonKey.TYPE]
        if geometry_type == GeoJsonGeomType.POINT:
            entry[GeoJsonKey.GEOMETRY][GeoJsonKey.COORDINATES] = round_list(entry[GeoJsonKey.GEOMETRY][GeoJsonKey.COORDINATES])
        elif geometry_type == GeoJsonGeomType.POLYGON:
            entry[GeoJsonKey.GEOMETRY][GeoJsonKey.COORDINATES] = [
                [round_list(pair) for pair in segment]
                for segment in entry[GeoJsonKey.GEOMETRY][GeoJsonKey.COORDINATES]
            ]

    return json_data


def print_precision_table(latitude: float) -> None:
    deg_long_distance = math.cos(math.radians(latitude)) * 111045  # 111045 meters = 69 miles
    print("{:<10} {:>10}".format('Decimal\nPlaces\t', 'Precision'))
    for i in range(11):
        fmt_dist = _meters_to_metric_dist_string(deg_long_distance / (10**i))
        fmt_str: str = "{:<5} {:>13} ".format(i, fmt_dist)
        print(fmt_str)


def _meters_to_metric_dist_string(meters: float) -> str:
    formatted_str: str = ''
    if meters >= 1000:
        formatted_str = f'{round(meters / 1000, 3)} km'
    elif meters >= 1:
        formatted_str = f'{round(meters, 3)} m'
    elif meters >= 1e-2:
        formatted_str = f'{round(meters * 10, 3)} cm'
    elif meters >= 1e-5:
        formatted_str = f'{round(meters * 1000, 3)} mm'
    else:
        formatted_str = f'{round(meters * 10e6, 3)} μm'

    return formatted_str


def nth_entry(json_data: Dict[str, any], index: int):
    try:
        entry: Dict[str, any] = json_data[GeoJsonKey.FEATURES][index]
        print(f'Entry {index} in the features list: \n')
        _print_JSON_colors(entry, 'emacs')
    except IndexError:
        parser.error(f'-n/--nth-feature requires a valid index but recieved {index}, which is larger than the feature array.')


def quick_stats(json_data: Dict[str, any]):
    stats: Dict[str, any] = {'total_features': None, 'feature_types': {}}
    stats['total_features'] = len(json_data[GeoJsonKey.FEATURES])
    for entry in json_data[GeoJsonKey.FEATURES]:
        if entry[GeoJsonKey.GEOMETRY] is None:
            stats['feature_types'][GeoJsonGeomType.NULL_GEOM] = stats['feature_types'].get(GeoJsonGeomType.NULL_GEOM, 0) + 1
        else:
            geom_type = entry[GeoJsonKey.GEOMETRY][GeoJsonKey.TYPE]
            stats['feature_types'][geom_type] = stats['feature_types'].get(geom_type, 0) + 1
    _print_JSON_colors(stats, 'murphy')


def count_features_with(json_data: Dict[str, any], feature_map: Dict[str, any]) -> None:
    result_dict = {}
    for entry in json_data[GeoJsonKey.FEATURES]:
        for k, v in feature_map.items():
            result_key = f'{k} == {v}'
            if result_key in result_dict and entry[GeoJsonKey.PROPERTIES][k] == v:
                result_dict[result_key] += 1
            elif result_key not in result_dict and entry[GeoJsonKey.PROPERTIES][k] == v:
                result_dict[result_key] = 1

    _print_JSON_colors(result_dict)


def first_occurance(json_data: Dict[str, any], feature_map: Dict[str, any]) -> None:
    for entry in json_data[GeoJsonKey.FEATURES]:
        count = 0
        for k, v in feature_map.items():
            if k in entry[GeoJsonKey.PROPERTIES] and entry[GeoJsonKey.PROPERTIES][k] == v:
                count += 1
        if count == len(list(feature_map.keys())):
            _print_JSON_colors(entry)
            return


def _print_JSON_colors(pydict: Dict[str, any], style: str = 'emacs'):
    json_str: str = json.dumps(pydict, indent=4)
    formatted_str: str = highlight(json_str, lexers.JsonLexer(), formatters.TerminalFormatter(style=style))
    print(formatted_str)


def get_boundary_colors(num: int, cmap_name: str) -> Dict[int, str]:
    # creates a dictionary of discrete colors from a continuous colormap
    cmap = matplotlib.colormaps[cmap_name].resampled(num)
    return {i: matplotlib.colors.rgb2hex(cmap(i)) for i in range(cmap.N)}


def _normalize_hex_color(hex_color: str) -> str | None:
    if not isinstance(hex_color, str):
        return None

    normalized = hex_color.strip()
    if not normalized:
        return None

    if not normalized.startswith('#'):
        normalized = f'#{normalized}'

    if not re.fullmatch(r'#[0-9a-fA-F]{6}', normalized):
        return None

    return normalized.lower()


def _hex_to_lab(hex_color: str) -> np.ndarray:
    normalized = _normalize_hex_color(hex_color)
    if not normalized:
        raise ValueError(f'invalid hex color: {hex_color}')

    rgb = np.array([
        int(normalized[1:3], 16) / 255.0,
        int(normalized[3:5], 16) / 255.0,
        int(normalized[5:7], 16) / 255.0,
    ])
    return color.rgb2lab(rgb.reshape(1, 1, 3)).reshape(3,)


def plot_lab_color_hierarchy_3d(
    color_tree: Dict[str, any],
    title: str = 'Genus / Species / Cultivar Colors in LAB Space',
    annotate_genus: bool = True,
    max_cultivars_per_genus: int | None = None,
) -> None:
    if not isinstance(color_tree, dict) or len(color_tree) == 0:
        logging.warning('No color data to plot (empty or invalid top-level structure).')
        return

    genus_points: List[Tuple[str, np.ndarray, str]] = []
    cultivar_points: List[Tuple[str, np.ndarray, str]] = []

    for genus_name, genus_entry in color_tree.items():
        if not isinstance(genus_entry, dict):
            continue

        genus_hex = _normalize_hex_color(genus_entry.get(ColorMapKey.COLOR))
        genus_lab = None
        if genus_hex:
            try:
                genus_lab = _hex_to_lab(genus_hex)
                genus_points.append((genus_name, genus_lab, genus_hex))
            except Exception:
                genus_lab = None

        species = genus_entry.get(ColorMapKey.SPECIES, {})
        if not isinstance(species, dict):
            continue

        cultivar_count_for_genus = 0
        for species_name, species_entry in species.items():
            if not isinstance(species_entry, dict):
                continue

            species_hex = _normalize_hex_color(species_entry.get(ColorMapKey.COLOR))
            if species_hex:
                try:
                    species_lab = _hex_to_lab(species_hex)
                    label = f'{genus_name} / {species_name} [species]'
                    cultivar_points.append((label, species_lab, species_hex))
                    cultivar_count_for_genus += 1
                except Exception:
                    pass

            cultivars = species_entry.get(ColorMapKey.CULTIVARS, {})
            if not isinstance(cultivars, dict):
                continue

            for cultivar_name, cultivar_hex_raw in cultivars.items():
                if max_cultivars_per_genus is not None and cultivar_count_for_genus >= max_cultivars_per_genus:
                    break

                cultivar_hex = _normalize_hex_color(cultivar_hex_raw)
                if not cultivar_hex:
                    continue

                try:
                    cultivar_lab = _hex_to_lab(cultivar_hex)
                    label = f'{genus_name} / {species_name} / {cultivar_name}'
                    cultivar_points.append((label, cultivar_lab, cultivar_hex))
                    cultivar_count_for_genus += 1
                except Exception:
                    continue

    if not genus_points and not cultivar_points:
        logging.warning('No valid colors found to plot after filtering invalid/null entries.')
        return

    fig = matplotlib.pyplot.figure(figsize=(12, 9))
    ax = fig.add_subplot(111, projection='3d')

    if cultivar_points:
        c_l = [p[1][0] for p in cultivar_points]
        c_a = [p[1][1] for p in cultivar_points]
        c_b = [p[1][2] for p in cultivar_points]
        c_col = [p[2] for p in cultivar_points]
        ax.scatter(c_l, c_a, c_b, c=c_col, s=18, alpha=0.7, label='Species/Cultivar')

    if genus_points:
        g_l = [p[1][0] for p in genus_points]
        g_a = [p[1][1] for p in genus_points]
        g_b = [p[1][2] for p in genus_points]
        g_col = [p[2] for p in genus_points]
        ax.scatter(g_l, g_a, g_b, c=g_col, s=130, edgecolors='black', linewidths=0.6, alpha=1.0, label='Genus')

        if annotate_genus:
            for genus_name, lab, _hex in genus_points:
                ax.text(lab[0], lab[1], lab[2], str(genus_name), fontsize=7)

    ax.set_xlabel('L*')
    ax.set_ylabel('a*')
    ax.set_zlabel('b*')
    ax.set_title(title)
    ax.legend(loc='best')
    matplotlib.pyplot.tight_layout()
    matplotlib.pyplot.show()


def plot_lab_colors_from_file(
    color_map_file: str,
    title: str = 'Genus / Species / Cultivar Colors in LAB Space',
    annotate_genus: bool = True,
    max_cultivars_per_genus: int | None = None,
) -> None:
    color_tree = loadjson(color_map_file)
    plot_lab_color_hierarchy_3d(
        color_tree,
        title=title,
        annotate_genus=annotate_genus,
        max_cultivars_per_genus=max_cultivars_per_genus,
    )

def assign_neighbourhoods(trees_data: Dict[str, any], boundaries_data: Dict[str, any]) -> Dict[str, any]:
    """
    Spatially assign neighbourhood_name to each tree feature using a point-in-polygon
    test against the provided boundary FeatureCollection.

    Uses a shapely STRtree spatial index for efficient lookup (O(log n) per tree).
    Points exactly on a boundary ring are treated as inside via polygon.covers(point).

    Requires shapely >= 2.0.
    """

    # Pre-process boundaries: build shapely geometries and STRtree index
    boundary_polygons = []
    boundary_names = []
    for feature in boundaries_data[GeoJsonKey.FEATURES]:
        geom_data = feature.get(GeoJsonKey.GEOMETRY)
        if geom_data is None:
            logging.warning(
                'Boundary feature "%s" has null geometry; skipping.',
                feature.get(GeoJsonKey.PROPERTIES, {}).get(BoundaryPropKey.NAME, '<unknown>')
            )
            continue
        try:
            polygon = shape(geom_data)
        except Exception as exc:
            logging.warning(
                'Boundary feature "%s" has invalid geometry (%s); skipping.',
                feature.get(GeoJsonKey.PROPERTIES, {}).get(BoundaryPropKey.NAME, '<unknown>'),
                exc
            )
            continue
        boundary_polygons.append(polygon)
        boundary_names.append(feature[GeoJsonKey.PROPERTIES][BoundaryPropKey.NAME])

    if not boundary_polygons:
        logging.warning('No valid boundary polygons found; all trees will have neighbourhood_name = null.')
        for feature in trees_data[GeoJsonKey.FEATURES]:
            feature[GeoJsonKey.PROPERTIES][TreePropKey.NEIGHBOURHOOD_NAME] = None
        return trees_data

    index = STRtree(boundary_polygons)

    matched = 0
    unmatched = 0
    neighbourhood_counts: Dict[str, int] = {}

    for feature in trees_data[GeoJsonKey.FEATURES]:
        geometry = feature.get(GeoJsonKey.GEOMETRY)
        if geometry is None:
            feature[GeoJsonKey.PROPERTIES][TreePropKey.NEIGHBOURHOOD_NAME] = None
            unmatched += 1
            continue

        coords = geometry.get(GeoJsonKey.COORDINATES)
        if not coords:
            feature[GeoJsonKey.PROPERTIES][TreePropKey.NEIGHBOURHOOD_NAME] = None
            unmatched += 1
            continue

        point = Point(coords[0], coords[1])  # (longitude, latitude)

        # STRtree.query returns indices of candidates whose bounding boxes intersect
        candidate_indices = index.query(point)
        hits = [i for i in candidate_indices if boundary_polygons[i].covers(point)]

        if len(hits) == 1:
            name = boundary_names[hits[0]]
        elif len(hits) == 0:
            name = None
        else:
            name = boundary_names[hits[0]]
            logging.debug(
                'Tree at (%s, %s) matched %d boundaries; using first match "%s".',
                coords[0], coords[1], len(hits), name
            )

        feature[GeoJsonKey.PROPERTIES][TreePropKey.NEIGHBOURHOOD_NAME] = name
        if name is not None:
            matched += 1
            neighbourhood_counts[name] = neighbourhood_counts.get(name, 0) + 1
        else:
            unmatched += 1

    logging.info('Assigned neighbourhoods: %d trees matched, %d trees unassigned (null).', matched, unmatched)
    for name, count in sorted(neighbourhood_counts.items()):
        logging.debug('  %-40s %d trees', name, count)

    return trees_data


# --- End Helpers ---

try:
    parser = argparse.ArgumentParser(description=('Street tree and boundary GeoJSON processing CLI'),
                                     formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('-v', '--verbose', action='store_true', help='increase the script verbosity')

    subparsers = parser.add_subparsers(title='subcommands', help='commands', dest='cmd')

    # 'create' command
    parser_create = subparsers.add_parser('create', help='create newly processed geojson files')

    parser_create.add_argument('-n', '--name', required=True, help='dataset key to process: [van-tree | nw-tree | van-bound | nw-bound]')
    parser_create.add_argument('-o', '--outfile', required=True, help='output path for processed GeoJSON')
    parser_create.add_argument('-x', '--exclude', nargs='+', help='property fields to exclude from each feature')
    parser_create.add_argument('-gc', '--generate-colors', help='generate a genus/species/cultivar color dictionary from a JSON list of hex colors')
    parser_create.add_argument('-ac', '--assign-colors', help='assign colors using a genus/species/cultivar color dictionary JSON file')
    parser_create.add_argument('-ss', '--set-seed', type=int, default=0, help='seed for numpy RNG (defaults to 0) to keep color generation repeatable')
    parser_create.add_argument('-d', '--download-data', action='store_true', help='download raw data via get-data.sh before processing')
    parser_create.add_argument('-rn', '--rename-properties', type=json.loads, help='rename property keys; provide a JSON mapping of property field names to new names. Ex: \'{"curr_key": "new_key"}\'')
    parser_create.add_argument('-lc', '--lower-case', action='store_true', help='make all property keys lowercase')
    parser_create.add_argument('-uc', '--upper-case', action='store_true', help='make all property keys uppercase')
    parser_create.add_argument('-rp', '--reduce-precision', type=int, help='reduce geometry precision to the provided decimal places (will not expand precision)')
    parser_create.add_argument('-nk', '--new-key', help='add a new key with either a constant value or a value derived from other keys')  # TODO: big time TODO
    parser_create.add_argument('-s', '--stats', action='store_true', help='generate stats JSON next to the output; for trees this can also drive color assignment')
    parser_create.add_argument('-cmap', help='matplotlib colormap name for boundary shading (used with -s): https://matplotlib.org/stable/gallery/color/colormap_reference.html')
    parser_create.add_argument('-an', '--assign-neighbourhoods', action='store_true', help='spatially assign neighbourhood_name to each tree feature using the van-bound boundaries file (van-tree only)')

    # 'info' command
    parser_info = subparsers.add_parser('info', help='get information about a dataset')

    parser_info.add_argument('-n', '--name', help='dataset key: [van-tree | nw-tree | van-bound | nw-bound]')
    parser_info.add_argument('-i', '--infile', help='path to a GeoJSON file (use instead of -n)')
    parser_info.add_argument('-nf', '--nth-feature', type=int, help='print the Nth feature to the console (negative indexing allowed)')
    parser_info.add_argument('-qs', '--quick-stats', action='store_true', help='print number and type of features in the GeoJSON')
    parser_info.add_argument('-cfw', '--count-features-with', type=json.loads, help='count features with the provided key/value pairs (JSON object)')
    parser_info.add_argument('-fo', '--first-occurance', type=json.loads, help='print first occurrence of the feature with the provided properties (JSON object)')
    parser_info.add_argument('--plot-lab-3d', action='store_true', help='plot genus/species/cultivar color map in 3D LAB space (does not run by default)')
    parser_info.add_argument('--color-map', help='path to genus/species/cultivar color JSON map (required when --plot-lab-3d is used)')

    # 'plot-lab' command
    parser_plot_lab = subparsers.add_parser('plot-lab', help='plot a genus/species/cultivar color map in 3D LAB space')
    parser_plot_lab.add_argument('-i', '--infile', required=True, help='path to genus/species/cultivar color JSON map file')
    parser_plot_lab.add_argument('--title', default='Genus / Species / Cultivar Colors in LAB Space', help='plot title')
    parser_plot_lab.add_argument('--no-annotate-genus', action='store_true', help='disable genus label annotations')
    parser_plot_lab.add_argument('--max-cultivars-per-genus', type=int, help='optional cap for species/cultivar points per genus')

    # 'table' command
    parser_table = subparsers.add_parser('table', help='helpful tables and unit reminders')
    parser_table.add_argument('-pal', '--precision-at-latitude', type=float, help='print a helper table of decimal place precision at the given latitude')

    args = parser.parse_args()

    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO)

    # dictionary dispatch by case
    data_choices = {'van-tree': process_trees,
                    'nw-tree': process_trees,
                    'van-bound': process_boundaries,
                    'nw-bound': process_boundaries
                    }
    shell_args = {'van-tree': '-v',
                  'nw-tree': '-w',
                  'van-bound': '-b',
                  'nw-bound': '-b'
                  }

    if args.cmd == 'create':
        # set the global random seed
        np.random.seed(args.set_seed)

        if args.download_data and args.name in shell_args:
            proc: subprocess.Popen = subprocess.Popen(['./get-data.sh', shell_args[args.name]])
            proc.communicate()
            if proc.returncode != 0:
                logging.error('Error downloading data from source.')
                sys.exit(1)

        # get returns the value associated with the key, or a default (the second argument)
        data_choices.get(args.name,
                lambda x: parser.error(
                            ('\'create\' command expected one of'
                            '[van-tree | nw-tree | van-bound | nw-bound]'
                            f'but recieved \"{args.name}\"'))
                            )(args)
    elif args.cmd == 'info':
        if args.name and args.infile:
            parser.error('requires -n/--name OR -i/--infile but recieved both')
        if not (args.name or args.infile):
            parser.error('requires ONE of -n/--name or -i/--infile')

        json_data: Dict[str, any] = loadjson(file_paths[args.name] if args.name else args.infile)
        if args.nth_feature:
            nth_entry(json_data, args.nth_feature)
        if args.quick_stats:
            quick_stats(json_data)
        if args.count_features_with:
            count_features_with(json_data, args.count_features_with)
        if args.first_occurance:
            first_occurance(json_data, args.first_occurance)
        if args.plot_lab_3d:
            if not args.color_map:
                parser.error('--plot-lab-3d requires --color-map')
            plot_lab_colors_from_file(args.color_map)
    elif args.cmd == 'table':
        if args.precision_at_latitude is not None:
            print_precision_table(args.precision_at_latitude)
    elif args.cmd == 'plot-lab':
        if args.max_cultivars_per_genus is not None and args.max_cultivars_per_genus < 1:
            parser.error('--max-cultivars-per-genus must be >= 1 when provided')
        plot_lab_colors_from_file(
            args.infile,
            title=args.title,
            annotate_genus=not args.no_annotate_genus,
            max_cultivars_per_genus=args.max_cultivars_per_genus,
        )
    else:
        parser.print_help()

except Exception as e:
    print(e)
    traceback.print_exception(e)
