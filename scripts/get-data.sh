#!/bin/bash
set -eu

# All JSON files are formatted to GEOJSON specifications

# geoJSON
VANCOUVER_URL='https://opendata.vancouver.ca/explore/dataset/street-trees/download/?format=geojson'
NEW_WESTMINSTER_WEST_URL='http://opendata.newwestcity.ca/downloads/tree-inventory-west/TREES_WEST.json'
NEW_WESTMINSTER_EAST_URL='http://opendata.newwestcity.ca/downloads/tree-inventory-east/TREES_EAST.json'

# boundaries/neighborhoods
VANCOUVER_BOUNDARIES_URL='https://opendata.vancouver.ca/explore/dataset/local-area-boundary/download/?format=geojson&timezone=America/Los_Angeles&lang=en'
NEW_WESTMINSTER_BOUNDARIES_URL='http://opendata.newwestcity.ca/downloads/neighbourhoods/NEIGHBOURHOOD_BOUNDARIES.json'

# file locations
VAN_TREE_PATH='../opendata/raw/vancouver-all-trees-raw.json'
NW_WEST_TREE_PATH='../opendata/raw/new-westminster-west-trees-raw.json'
NW_EAST_TREE_PATH='../opendata/raw/new-westminster-east-trees-raw.json'
# NW_WEST_TREE_PATH='../opendata/nw-test1.json'
# NW_EAST_TREE_PATH='../opendata/nw-test2.json'
NW_TMP_MERGE_PATH='../opendata/raw/new-westminster-trees-merged_tmp.json'
NW_FINAL_MERGE_PATH='../opendata/raw/new-westminster-trees-merged.json'
VAN_BOUNDARY_PATH='../opendata/raw/vancouver-boundaries-raw.json'
NW_BOUNDARY_PATH='../opendata/raw/new-westminster-boundaries-raw.json'

usage()
{
>&2 cat <<-EOH

Usage: $0 [-v] [-w] [-b]

-v      download the Vancvouer street trees dataset
-w      download the New Westminster street trees dataset
-b      download the boundaries datasets for Vancouver and New Westminster

EOH
}

download_vancouver_trees()
{
    echo "Downloading Vancouver trees..."
    curl "$VANCOUVER_URL" --create-dirs -o $VAN_TREE_PATH
}

# TODO: add an explanation of wtf I am doing here as I don't remember and jq isn't intuitive to me
merge_new_west_trees()
{
    [ -e $NW_FINAL_MERGE_PATH ] || rm $NW_FINAL_MERGE_PATH 
    jq --slurp '.[0]["features"] + .[1]["features"]' $NW_WEST_TREE_PATH $NW_EAST_TREE_PATH > $NW_TMP_MERGE_PATH
    jq --slurp '{"type": "FeatureCollection", "features": .[]}' $NW_TMP_MERGE_PATH >> $NW_FINAL_MERGE_PATH
    
    # remove all the intermediary files
    rm -f $NW_WEST_TREE_PATH $NW_EAST_TREE_PATH $NW_TMP_MERGE_PATH 
}

download_newwest_trees()
{
    echo "Downloading New Westminster trees..."
    curl "$NEW_WESTMINSTER_EAST_URL" --create-dirs -o $NW_EAST_TREE_PATH
    curl "$NEW_WESTMINSTER_WEST_URL" --create-dirs -o $NW_WEST_TREE_PATH

    echo "Merging East and West New Westminster data..."
    merge_new_west_trees
}

download_boundaries_data()
{
    curl "$VANCOUVER_BOUNDARIES_URL" --create-dirs -o $VAN_BOUNDARY_PATH
    curl "$NEW_WESTMINSTER_BOUNDARIES_URL" --create-dirs -o $NW_BOUNDARY_PATH
}



while getopts ":hvwb" opt; do
    case ${opt} in
    h )
        usage
        ;;
    v )
        download_vancouver_trees
        ;;
    w )
        download_newwest_trees
        ;;
    b )
        download_boundaries_data
        ;;
    \?) 
        echo "Invalid option -$OPTARG"
        usage
        ;;
    esac
done
