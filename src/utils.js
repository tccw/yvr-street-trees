// import { filterProperties } from "@turf/clusters";
import { LAYER_NAME } from '../env';

/**
 * https://stackoverflow.com/questions/35504848/capitalize-hyphenated-names-in-javascript
 * @param {string} string
 * @returns {string} the formatted string In Title Case Like This
 */
export function titleCase(string, separators) {

  separators = separators || [ ' ', '-' ];
  var regex = new RegExp('(^|[' + separators.join('') + '])(\\w)', 'g');
  return string.toLowerCase().replace(regex, function(x) { return x.toUpperCase(); }).trim();
};

export function sentenceCase(string) {
  return string.charAt(0).toUpperCase() +  string.slice(1).toLowerCase();
}


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
 * @param {number[]} diameters An array of the min and max diameter to filter to
 * @param {number[]} height_ids A list of height ids to filter by
 * @param {string[]} trees A list of tree common names to filter by
 * @returns {any[]} the formatted filter list ready to be passed to a MapGL <Layer/> component
 */
 export function treeFilterCompositor(filterObject, selected) {
  const {diameters, height_ids, trees} = filterObject;

  let filter = ['all'];

  if (diameters) {
    //TODO: change this so that the max diameter notch is not hardcoded
    if (diameters[1] == 42) {
      filter.push(['all', ['>=', ['get', 'diameter'], diameters[0]]]); // add the case expression to the filter
    } else {
      filter.push(['all', ['>=', ['get', 'diameter'], diameters[0]], ['<=', ['get', 'diameter'], diameters[1]]]); // add the case expression to the filter
    }
  }

  if (height_ids) {
    filter.push(['match', ['get','height_range_id'], height_ids, true, false]);
  }

  if (trees) {
    filter.push(['match', ['get', 'common_name'], trees, true, false]);
  }

  if (selected && selected.layer.id == LAYER_NAME) {
    filter.push(['!=', ['get', 'tree_id'], selected.properties.tree_id]);
  }

  return filter;
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

