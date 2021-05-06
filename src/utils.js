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
 * 
 * @param {Object} treeGeoJSON 
 * @returns {Map} a map of the common tree names and their mapped color
 */
export function getUniqueTreeNames(treeGeoJSON) { // will need to be updated to vector tiles after transition
  let  uniqueCommonNames = new Map();
  treeGeoJSON.features.forEach((entry) => {
    uniqueCommonNames[entry.properties.common_name] = entry.properties.color;
  });

  return uniqueCommonNames;
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
 * Need to consider cases where the filter already exists and the user is modifying it (rather than making one from scratch)
 * Possible ways to handle this:
 *    1. maintain an object in the parent component with initial state {diameters: null, height_ids: null, trees: null}.
 *        pass the object around and only clear it if the user has nothing selected (e.g. clicks empty space, etc.)
 */