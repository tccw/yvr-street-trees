import { filterProperties } from "@turf/clusters";

/**
 * 
 * @param {string} string 
 * @returns {string} the formatted string In Title Case Like This
 */
export function titleCase(string) {
  var result = "";
  string.split(" ").forEach((word) => {
      result += word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + ' ';
  })
  return result.trim();
};


/**
 * 
 * @param {number} height_range_id 
 * @returns {string} the calucalted height range from the id, ex. id 2 returns "10 - 20 ft"
 */
export function heightStringFromID(height_range_id) {
  return `${height_range_id * 10} - ${(height_range_id + 1) * 10} feet`
}


/**
 * Generates a properly formatted filter object to pass to a MapGL <Layer/> component
 * 
 * @param {number[]} diameters A list of diameters to filter by (should be the upper range of the 6 inche provided ranges)
 * @param {number[]} height_ids A list of height ids to filter by
 * @param {string[]} trees A list of tree common names to filter by
 * @returns {any[]} the formatted filter list ready to be passed to a MapGL <Layer/> component
 */
export function treeFilterCompositor({diameters, height_ids, trees}) {
  let filter = ['all'];

  if (diameters) {
    filter.push(_buildMapboxCaseExpression(diameters)); // add the case expression to the filter
  }
  
  if (height_ids) {
    filter.push(['match', ['get','height_range_id'], height_ids, true, false]);
  }

  if (trees) {
    filter.push(['match', ['get', 'common_name'], trees, true, false]);
  }
  
  return filter;
    
}


/**
 * 
 * @param {number[]} diameters 
 * @returns {any[]} a case expression formatted for input to a MapBox Layer component
 */
function _buildMapboxCaseExpression(diameters) {
  let caseExpr = ['case'];
    diameters.sort((a, b) => {return a - b}) // provice a comparator since sort() treats everyting as strings by default

    // build the case expression in this format: https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/?size=n_10_n#case
    diameters.forEach((diameter) => {
      if (diameter === 6) {
        caseExpr.push(['<', ['get', 'diameter'], 6]);
        caseExpr.push(true);
      } else if (diameter <= 42) {
        caseExpr.push(['all', ['>=', ['get', 'diameter'], diameter - 6], ['<', ['get', 'diameter'], diameter]]);
        caseExpr.push(true);
      } else {
        caseExpr.push(['>=', ['get', 'diameter'], 42]);
        caseExpr.push(true);
      }
    });

    caseExpr.push(false);  // push the default case output
    return caseExpr;
}


/**
 * Takes a date in the format YYYY-MM-DD and returns
 * a formatted date string <FullDayOfWeek>, <FullMonthName> <NumericDay>, <NumericYear>
 * 
 * Example: 1996-12-11 -> Wednesday, December 11, 1996
 * 
 * @param {string} yyyymmdd in the format YYYY-MM-DD
 * @returns {string} the formatted string of that date
 */
export function toPrettyDateString(yyyymmdd) {
  let options = { weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' };
  let split = yyyymmdd.split('-').map((elem) => { return parseInt(elem); });
  let date = new Date(split[0], split[1] - 1, split[2]);
  return date.toLocaleDateString('en-US', options);
}

/**
 * Constructs an object with neighborhood tree counts for stats displays.
 * The returned object is the of the form:
 * 
 * { 'city_tree_count': <total count of trees on map>,
 *   'tree_stats' : {
 *      <tree common name> : {
 *          'total_count': <tree count for this species in the city>,
 *          'color': 
 *          'neighborhood_counts': {
 *              <neighborhood_name> : <tree count in specific neighborhood>,
 *              <...other entries>
 *          }
 *       }
 *    }
 *    'neigh_num_trees`: {
 *        <neighborhood name> : <total tree count>
 *        <...other entries>
 *    }
 * }
 *  
 * NOTE: This might all have to be pre-computed when moving to the full 145k+ trees.
 * 
 * @param {JSON} JSONarray 
 * @returns {object}
 */
 export function getTreeStats(JSONarray) {
  let numTrees = JSONarray.length;
  let treeObj = {};
  let totalCountsNeigh = {};

  // get the total counts for each tree type
  JSONarray.forEach((entry) => {
    var neighbourhood_name = entry.properties.neighbourhood_name;
    // if the tree is already in the object count the tree, else add the new tree name to the object
    if (entry.properties.common_name in treeObj) {
      treeObj[entry.properties.common_name].total_count++;
      // if the neighborhood the tree is in has already been added, add the tree to that neighborhood count
      if (neighbourhood_name in treeObj[entry.properties.common_name].neighborhood_counts) {
        treeObj[entry.properties.common_name].neighborhood_counts[neighbourhood_name]++;
      } else {
      // else add the tree color and add the neightborhood to the neightborhood_counts object
        treeObj[entry.properties.common_name]['color'] = entry.properties.color;
        treeObj[entry.properties.common_name].neighborhood_counts[neighbourhood_name] = 1;
      }
    } else {
      treeObj[entry.properties.common_name] = {
          'color': entry.properties.color,
          'total_count': 1, 
          'neighborhood_counts': {
           [neighbourhood_name]: 1
        }
      }
    } 
  });

  // counts the number of trees in each neighborhood
  for (const [key, value] of Object.entries(treeObj)) {
    for (const [k, v] of Object.entries(value.neighborhood_counts)) {
      
      if (k in totalCountsNeigh) {
        totalCountsNeigh[k] += v; // add the count for this tree to the total neightborhood count
      } else {
        totalCountsNeigh[k] = v;  //
      }
    }
  }

  // get the total tree counts per neighborhood to use for neighborhood stats

  return {'city_tree_count': numTrees, 'tree_stats': treeObj, 'neigh_num_trees': totalCountsNeigh};
}
