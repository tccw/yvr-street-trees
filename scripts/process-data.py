#!/usr/bin/env python3
import argparse
import logging
import sys
import json
import subprocess
import math
from numpy import save
from pylab import cm, matplotlib
from typing import List, Dict
from random import randint
from pygments import highlight, lexers, formatters
import traceback


# Example usage
"""
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

./process-data.py create \
    -n van-tree \
    -o ../opendata/processed/vancouver-all-trees-processed.json \
    -x std_street root_barrier street_side_name plant_area curb \
    -s
"""

# ---- Constants ----
file_paths = {
    'van-tree': '../opendata/raw/vancouver-all-trees-raw.json',
    'nw-tree': '../opendata/raw/new-westminster-trees-merged.json',
    'van-bound': '../opendata/raw/vancouver-boundaries-raw.json',
    'nw-bound': '../opendata/raw/new-westminster-boundaries-raw.json'
}


# ----- Helpers -----
def loadjson(filename: str) -> Dict[str, any]:
    with open(filename) as file:
        data: Dict[str, any] = json.load(file)

    return data

def savejson(filename: str, data) -> None:
    with open(filename, 'w') as file:
        json.dump(data, file)

def choose_color(count: int, bands: List[float], colors: Dict[str,str]) -> str:
    retcol: str = colors[len(colors) - 1]
    for i in range(len(colors)):
        if count <= bands[i]:
            retcol = colors[i]
            break

    return retcol

# Assign a random color from the available colors to each unique common name
def assign_random_colors(tree_data: Dict, colors: List[str]) -> Dict[str, any]:
    tree_types: Dict[str, any] = {}
    for entry in tree_data['features']:
        key = entry['properties']['common_name']
        tree_types[key] = None

    # assign a random color to each tree name
    for k in tree_types.keys():
        idx: int = randint(0, len(colors) - 1)
        tree_types[k] = colors[idx]

    for tree in tree_data['features']:
        tree_name: str = tree['properties']['common_name']
        tree['properties']['color'] = tree_types[tree_name]

    return tree_data


def process_trees(args: object):
    data: Dict[str, any] = loadjson(file_paths[args.name])

    if args.reduce_precision:
        data = reduce_precision(data, args.reduce_precision)
    if args.exclude:
        data = exlude_keys(data, args.exclude)
    if args.rename_properties:
        data = rename_prop_keys(data, args.rename_properties)
    if args.stats:
        calc_tree_stats(data, args.outfile)

    savejson(args.outfile, data)


def process_boundaries(args: object):
    data: Dict[str, any] = loadjson(file_paths[args.name])
    if args.reduce_precision:
        data = reduce_precision(data, args.reduce_precision)

    savejson(args.outfile, data)


# TODO: remove this function if Tilequery API works out
def calc_tree_stats(json_data: json, outfile: str):
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
    tree_stats = _calc_tree_stats(json_data)
    neighborhood_stats = _calc_neighborhood_stats(json_data)

    # get per neighborhood stats
    stats_outfile = f"{outfile[:outfile.rfind('.')]}-stats{outfile[outfile.rfind('.'):]}"
    savejson(stats_outfile, {'tree_stats': tree_stats, 'neighborhood_stats': neighborhood_stats})


def _calc_tree_stats(json_data: Dict[str, any]):
    tree_stats = {}
    for entry in json_data['features']:
        neighborhood_name = entry['properties']['neighbourhood_name']
        common_name = entry['properties']['common_name']
        # if the tree is already in the object count the tree, else add the new tree name to the object
        if common_name in tree_stats:
            tree_stats[common_name]['total_count'] += 1
            tree_stats[common_name]['average_diameter'] += entry['properties']['diameter']  # will be the sum until the end
            tree_stats[common_name]['average_height_id'] += entry['properties']['height_range_id']
            # if the neighborhood the tree is in has already been added, add the tree to that neighborhood count
            if neighborhood_name in tree_stats[common_name]['neighborhood_counts']:
                tree_stats[common_name]['neighborhood_counts'][neighborhood_name] += 1
            # else add the tree color and add the neightborhood to the neightborhood_counts object
            else:
                pass
                # do something with the colors here
                tree_stats[common_name]['neighborhood_counts'][neighborhood_name] = 1
        else:
            tree_stats[common_name] = {
                'total_count': 1,
                'average_diameter': entry['properties']['diameter'],
                'average_height_id': entry['properties']['height_range_id'],
                'neighborhood_counts': {
                    neighborhood_name: 1
                }
            }
    # make the averages actual averages
    for k in tree_stats.keys():
        tree_stats[k]['average_diameter'] = round(tree_stats[k]['average_diameter'] / tree_stats[k]['total_count'], 2)
        tree_stats[k]['average_height_id'] = round(tree_stats[k]['average_height_id'] / tree_stats[k]['total_count'])

    return tree_stats


def _calc_neighborhood_stats(json_data: Dict[str, any]):
    neighborhood_stats = {}

    for entry in json_data['features']:
        neighborhood_name = entry['properties']['neighbourhood_name']
        if neighborhood_name in neighborhood_stats:
            neighborhood_stats[neighborhood_name]['total_count'] += 1
            neighborhood_stats[neighborhood_name]['average_diameter'] += entry['properties']['diameter']
            neighborhood_stats[neighborhood_name]['average_height_id'] += entry['properties']['height_range_id']
        else:
            neighborhood_stats[neighborhood_name] = {
                'total_count': 1,
                'average_diameter': entry['properties']['diameter'],
                'average_height_id': entry['properties']['height_range_id']
            }

    for k in neighborhood_stats.keys():
        neighborhood_stats[k]['average_diameter'] = round(neighborhood_stats[k]['average_diameter'] / neighborhood_stats[k]['total_count'], 2)
        neighborhood_stats[k]['average_height_id'] = round(neighborhood_stats[k]['average_height_id'] / neighborhood_stats[k]['total_count'])

    return neighborhood_stats


def rename_prop_keys(json_data: Dict[str, any], swap_json) -> Dict[str, any]:
    """
        Change the name of any property keys
    """
    for entry in json_data['features']:
        for old_key, new_key in swap_json.items():
            if old_key in entry['properties']:
                value = entry['properties'].pop(old_key)
                entry['properties'][new_key] = value

    return json_data


def keys_to_upper(json_data: Dict[str, any]) -> Dict[str, any]:
    for entry in json_data['features']:
        entry['properties'] = {k.upper(): v for k,v in entry['properties'].items()}

    return json_data


def keys_to_lower(json_data: Dict[str, any]) -> Dict[str, any]:
    for entry in json_data['features']:
        entry['properties'] = {k.lower(): v for k,v in entry['properties'].items()}

    return json_data


def exlude_keys(json_data: Dict[str, any], exlude_keys: List[str]):
    for entry in json_data['features']:
        for ex_key in exlude_keys:
            if ex_key in entry['properties']:
                entry['properties'].pop(ex_key)

    return json_data


# reduce precision without expanding if already below
def reduce_precision(json_data: Dict[str, any], decimals: int) -> Dict[str, any]:
    # checking each feature type seems redundant but the GeoJSON spec allows
    # for multiple types in the same feature list
    round_list = lambda pair: [round(coord, decimals) for coord in pair] if pair is not None else pair

    for entry in json_data['features']:
        geometry: str = entry['geometry']['type']
        if geometry == 'Point':
            entry['geometry']['coordinates'] = round_list(entry['geometry']['coordinates'])
        elif geometry == 'Polygon':
            entry['geometry']['coordinates'] = [[round_list(pair) for pair in segment] for segment in entry['geometry']['coordinates']]

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
        entry: Dict[str, any] = json_data['features'][index]
        print( f'Entry {index} in the features list: \n')
        _print_JSON_colors(entry, 'emacs')
    except IndexError:
        parser.error(f'-n/--nth-feature requires a valid index but recieved {index}, which is larger than the feature array.')


def quick_stats(json_data: Dict[str, any]):
    quick_stats: Dict[str, float or Dict[str, float]] = {'total_features': None, 'feature_types': {}}
    quick_stats['total_features'] = len(json_data['features'])
    for entry in json_data['features']:
        if entry['geometry'] is None:
            if 'null_geom' in quick_stats['feature_types']:
                quick_stats['feature_types']['null_geom'] += 1
            else:
                quick_stats['feature_types']['null_geom'] = 1
        elif entry['geometry']['type'] in quick_stats['feature_types']:
            quick_stats['feature_types'][entry['geometry']['type']] += 1
        else:
            quick_stats['feature_types'][entry['geometry']['type']] = 1
    _print_JSON_colors(quick_stats, 'murphy')

def count_features_with(json_data: Dict[str, any], feature_map: Dict[str, any]) -> None:
    pass  # stub


def _print_JSON_colors(pydict: Dict[str, any], style: str):
    json_str: str = json.dumps(pydict, indent=4)
    formatted_str: str = highlight(json_str, lexers.JsonLexer(), formatters.TerminalFormatter(style=style))
    print(formatted_str)


def get_boundary_colors(num: int, cmap_name: str) -> List[str]:
    # creates a dictionary of discrete colors from a continuous colormap
    cmap = cm.get_cmap(cmap_name, num)
    return {i : matplotlib.colors.rgb2hex(cmap(i)) for i in range(cmap.N)}

# --- End Helpers ---

try:
    parser = argparse.ArgumentParser(description=('street tree data processing cli'),
                                     formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('-v', '--verbose', action='store_true', help='increase the script verbosity')

    subparsers = parser.add_subparsers(title='subcommands', help='commands', dest='cmd')

    # 'create' command
    parser_create = subparsers.add_parser('create', help='create newly processed geojson files')

    parser_create.add_argument('-n', '--name', required=True, help='name of the data to processes [van-tree | nw-tree | van-bound | nw-bound]')
    parser_create.add_argument('-o', '--outfile', required=True, help='the filename for the processed data')
    parser_create.add_argument('-x', '--exclude', nargs='+', help='a list of property fields to exlude')
    parser_create.add_argument('-c', '--colors', action='store_true', help='pick colors for the data (omit if colors are already assigned)')
    parser_create.add_argument('-d', '--download-data', action='store_true', help='download the data before processing')
    parser_create.add_argument('-rn', '--rename-properties', type=json.loads, help='rename property keys; provide a JSON mapping of property field names to new names. Ex: \'{"curr_key": "new_key"}\'')
    parser_create.add_argument('-lc', '--lower-case', action='store_true', help='make all property keys lowercase')
    parser_create.add_argument('-uc', '--upper-case', action='store_true', help='make all property keys uppercase')
    parser_create.add_argument('-rp', '--reduce-precision', type=int, help='reduce the precision of geometry to the provided decimal places (will not expand precision)')
    parser_create.add_argument('-nk', '--new-key', help='add a new key with either a constant value or a value derived from other keys')  # TODO: big time TODO
    parser_create.add_argument('-s', '--stats', action='store_true', help='generate JSON file with tree counts and avg height/diameter; will run after all other processing is complete')

    # 'info' command
    parser_info = subparsers.add_parser('info', help='get information about a dataset')

    parser_info.add_argument('-n', '--name', help='name of the data to processes [van-tree | nw-tree | van-bound | nw-bound]')
    parser_info.add_argument('-i', '--infile', help='path to a GeoJSON file')
    parser_info.add_argument('-nf', '--nth-feature', type=int, help='print the Nth feature to the console (negative indexing allowed)')
    parser_info.add_argument('-qs', '--quick-stats', action='store_true', help='prints out the number and type of features in the GeoJSON')
    parser_info.add_argument('-cfw', '--count-features-with', type=json.loads, help='count features with the provided key value pairs')

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
    elif args.cmd == 'table':
        if args.precision_at_latitude is not None:
            print_precision_table(args.precision_at_latitude)
    else:
        parser.print_help()

except Exception as e:
    print(e)
    traceback.print_exception(e)
