#!/usr/bin/env python3
import argparse
import logging
import json
import subprocess
from pylab import *
import traceback 


# ---- Constants ----
file_paths = {
    'van_trees': '../opendata/raw/vancouver-all-trees-raw.json',
    'nw_trees': '../opendata/raw/new-westminster-trees-merged.json',
    'van_boundaries': '../opendata/raw/vancouver-boundaries-raw.json',
    'nw_boundaries': '../opendata/raw/new-westminster-boundaries-raw.json'
}


# ----- Helpers -----
def loadjson(filename: str) -> {}:
    with open(filename) as file:
        data = json.load(file)
    
    return data

def savejson(filename: str, data):
    with open(filename, 'w') as file:
        json.dump(data, file)

def choose_color(count: int, bands: [float], colors: {str: str}):
    retcol = colors[len(colors) - 1]
    for i in range(len(colors)):
        if count <= bands[i]:
            retcol = colors[i]
            break
    
    return retcol

# Assign a random color from the available colors to each unique common name
def assign_random_colors(tree_data: {}, colors: [str]):
    tree_types = {}
    for entry in tree_data['features']:
        key = entry['properties']['common_name']
        tree_types[key] = None
    
    # assign a random color to each tree name
    for k in tree_types.keys():
        idx = randint(0, len(colors) - 1)
        tree_types[k] = colors[idx]

    for tree in tree_data['features']:
        tree_name = tree['properties']['common_name']
        tree['properties']['color'] = tree_types[tree_name]
    
    return tree_data

def process_van_trees(args: object):
    data = loadjson(file_paths['van_trees'])
    stats = calc_tree_stats(data)
    pass

def process_nw_trees(args: object):
    data = loadjson(file_paths['nw_trees'])
    pass

def process_van_boundaries(args: object):
    data = loadjson(file_paths['van_boundaries'])
    pass

def process_nw_boundaries(args: object):
    data = loadjson(file_paths['nw_boundaries'])
    pass


def calc_tree_stats(json_data):
    """
    Constructs a dictionary with neighborhood tree counts for stats displays.
    The returned dict is of the form:

    {
        'city_tree_count': <total count of trees on map>,
        'tree_stats': {
            <tree common name> : {
                'total_count': <tree count for this species in the city>,
                'color': <hex color>,
                'neighborhood_counts': {
                    <neighborhood_name> : <tree count in specific neighborhood>,
                    <...other entries>
                }
            }
            'neigh_num_trees': {
                <neighborhood name> : <total tree count>
                <...other entries>
            }
        }
    }

    """
    trees = {}
    total_neighborhood_count = {}

    for entry in data['features']:
        neighborhood_name = entry['properties']['neighborhood_name']
        common_name = entry['properties']['common_name']

        if common_name in trees:
            trees[common_name]['total_count'] += 1
            if neighborhood_name in trees[common_name]['neighborhood_counts']:
                trees[common_name]['neighborhood_counts'][neighborhood_name] += 1
            else:
                trees[common_name]['neighborhood_counts'][neighborhood_name] = 1
        else:
            trees[common_name] = {
                'total_count': 1,
                'neighborhood_counts': {
                    neighborhood_name: 1
                }
            }
    



# creates a dictionary of discrete colors from a continuous colormap
def get_boundary_colors(num: int, cmap_name: str) -> [str]:
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

    args = parser.parse_args()

    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO)

    # dictionary dispatch by case
    data_choices = {'van-tree': process_van_trees, 
                    'nw-tree': process_nw_trees, 
                    'van-bounds': process_van_boundaries, 
                    'nw-bounds': process_nw_boundaries
                    }
    shell_args = {'van-tree': '-v', 
                   'nw-tree': '-w', 
                   'van-bounds': '-b', 
                   'nw-bounds': '-b'
                   }

    if args.cmd == 'create':
        if args.download_data and args.name in shell_args:
            subprocess.Popen(['./get-data.sh', shell_args[args.name]]).wait()

        # get returns the value associated with the key, or a default (the second argument)
        data_choices.get(args.name,
                lambda x: parser.error(
                    ('\'create\' command expected one of' 
                     '[van-tree | nw-tree | van-bound | nw-bound]'
                     f'but recieved \"{args.name}\"'))
                    )(args)
    else:
        parser.print_help()

except Exception as e:
    print(e)
    traceback.print_exception()