import json
from random import randint
from common import loadjson, savejson

# --- Helpers
def choose_color(count: int, bands: [float], colors: {str: str}):
    retcol = colors[len(colors) - 1]
    for i in range(len(colors)):
        if count <= bands[i]:
            retcol = colors[i]
            break
    
    return retcol

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


def print_most_common_tree(data: {str: {}}):
    curr_max = 0
    curr_max_key = ''
    for key, value in data.items():
        if curr_max < value['count']:
            curr_max_key = key
            curr_max = value['count']
    print(f'The most common tree is {curr_max_key} with {curr_max} trees representing {data[curr_max_key]["percentage"]} percent of the population.')





# ---
bound_colors = {0: '#ccff33', 
          1: '#9ef01a', 
          2: '#70e000', 
          3: '#38b000', 
          4: '#008000', 
          5: '#007200', 
          6: '#006400', 
          7: '#004b23',
          8: '#002913'}

van_treefile = '../data/vancouver-street-trees.geojson'
nw_treefile = '../data/NewWest_All_Trees.json'
vanboundaryfile = '../data/local-area-boundary.geojson'
newwestboundaryfile = '../data/NewWest_Neighbourhoods.geojson'
nyc_tree_colorsfile = '../data/nyc-tree-colors.json'

# load and parse data
van_tree_data = loadjson(van_treefile)
nw_tree_data = loadjson(nw_treefile)
van_boundary_data = loadjson(vanboundaryfile)
nw_boundary_data = loadjson(newwestboundaryfile)
tree_colors = list(loadjson(nyc_tree_colorsfile).values())


# Count the number of trees in each neighborhood
van_tree_count = {} 
nw_tree_count = {}

for entry in van_tree_data['features']:
    key = entry['properties']['neighbourhood_name']
    if key not in van_tree_count:
        van_tree_count[key] = 0
    
    van_tree_count[key] += 1

for entry in nw_tree_data['features']:
    key = entry['properties']['NEIGH_NAME']
    if key not in nw_tree_count:
        nw_tree_count[key] = 0
    
    nw_tree_count[key] += 1

tree_types = {}
print(len(van_tree_data['features']))
for entry in van_tree_data['features']:
    key = entry['properties']['common_name']
    if key not in tree_types:
        tree_types[key] = 0
    
    tree_types[key] += 1

num_trees = len(van_tree_data['features'])
for key,value in tree_types.items():
    tree_types[key] = {'count': value, 'percentage': round((value / num_trees) * 100, 2)}


print_most_common_tree(tree_types)

output = [x for x in van_tree_data['features'] if (x['properties']['neighbourhood_name'].upper() == 'WEST POINT GREY') and x['geometry'] is not None]
# output = [x for x in van_tree_data['features'] if x['geometry'] is not None]
output = {"type": "FeatureCollection", "name": "West Point Grey Trees", "features": output}
output = assign_random_colors(output, tree_colors)
# remove all the unused keys
# keys_to_remove = ['assigned', 'plant_area', 'curb', 'std_street', 'root_barrier', 'street_side_name']
# for d in output['features']:
#     for key in keys_to_remove:
#         d['properties'].pop(key, None)

van_tree_data = assign_random_colors(van_tree_data, tree_colors)

# get color band ranges
counts = list(van_tree_count.values())
counts_nw = list(nw_tree_count.values())
counts_nw.sort()
counts.sort()
# lower_bounds = [counts_nw[0] + ((counts[-1] - counts_nw[0]) / len(bound_colors)) * i for i in range(len(bound_colors))]
lower_bounds = [counts[0] + ((counts[-1] - counts[0]) / len(bound_colors)) * i for i in range(len(bound_colors))]

# Add this as a parameter to each neighborhood polygon in the boundary geojson
for boundary in van_boundary_data['features']: # O(mn) bad times man (in this case 22^2 operations...)
    for place in list(van_tree_count.keys()): 
        boundary['properties']['city'] = 'VANCOUVER'
        if boundary['properties']['name'].upper() == place:
            boundary['properties']['tree_count'] = van_tree_count[place]
            boundary['properties']['color'] = choose_color(van_tree_count[place], lower_bounds, bound_colors)
            

for boundary in nw_boundary_data['features']:
    for place in list(nw_tree_count.keys()):
        boundary['properties']['city'] = 'NEW WESTMINSTER'
        if boundary['properties']['NEIGH_NAME'] == place:
            boundary['properties']['tree_count'] = nw_tree_count[place]
            boundary['properties']['color'] = choose_color(nw_tree_count[place], lower_bounds, bound_colors) 

boundary_centroids = {"type": "FeatureCollection", "name": "West Point Grey Centroids", "features": []}
for boundary in van_boundary_data['features']:
    coords = boundary['properties']["geo_point_2d"][::-1]  # reverse with slicing since only 2 elements 
    tree_count = boundary['properties']['tree_count']
    neighborhood = boundary['properties']['name']
    boundary_centroids['features'].append({"type": "Feature", 
                                           "geometry": {
                                               "type": "Point", 
                                               "coordinates": coords
                                               }, 
                                            "properties": {"name": neighborhood,"tree_count": tree_count}})

# save modified geojson files
# savejson('../data/local-area-boundary-treecount.geojson', van_boundary_data)
# savejson('../data/nw-local-area-boundary-treecount.geojson', nw_boundary_data)
# savejson('../data/vancouver-west-point-trees-all.geojson', output)
# savejson('../data/local-area-boundary-treecount-centroids.geojson', boundary_centroids)
savejson('../data/vancouver-all-trees-colored.geojson', van_tree_data)
# savejson('../data/tree_count_types.json', tree_types)