import { LAYER_NAME } from '../../env';

/**
 * https://stackoverflow.com/questions/35504848/capitalize-hyphenated-names-in-javascript
 * @param {string} str
 * @returns {string} the formatted string In Title Case Like This
 */
export function titleCase(str: string, separators?: string[]) {

  separators = separators || [ ' ', '-', '"', '.' ];
  var regex = new RegExp('(^|[' + separators.join('') + '])(\\w)', 'g');
  return str.toLowerCase().replace(regex, function(x) { return x.toUpperCase(); }).trim();
};

export function sentenceCase(str: string) {
  return str.charAt(0).toUpperCase() +  str.slice(1).toLowerCase();
}


export function  cloudinaryImageName(genus: string, species: string) {
    return `yvr-street-trees/${genus}_${species
      .split(" ")[0]}`.toLowerCase();
};

export function cloudinaryImageNameCultivar(genus: string, species: string, cultivar?: string) {
    let result = cloudinaryImageName(genus, species);
    if (cultivar) {
        result += `_${cultivar.toLowerCase().split(/\s+/).join('_')}`;
    }

    return result;
}


/**
 * Generates a properly formatted filter object to pass to a MapGL <Layer/> component
 *
 * @param {number[]} diameters An array of the min and max diameter to filter to
 * @param {number[]} heights An array of the min and max height (in meters) to filter to
 * @param {string[]} trees A list of tree common names to filter by
 * @returns {any[]} the formatted filter list ready to be passed to a MapGL <Layer/> component
 */
 export function treeFilterCompositor(filterObject: any, selected?: any) {
  const {diameters, heights, trees} = filterObject;

  let filter: any[] = ['all'];

  if (diameters) {
    //TODO: change this so that the max diameter notch is not hardcoded
    if (diameters[1] == 100) {
      filter.push(['all', ['>=', ['get', 'diameter_cm'], diameters[0]]]); // add the case expression to the filter
    } else {
      filter.push(['all', ['>=', ['get', 'diameter_cm'], diameters[0]], ['<=', ['get', 'diameter_cm'], diameters[1]]]); // add the case expression to the filter
    }
  }

  if (heights) {
    if (heights[1] == 40) {
      filter.push(['all', ['>=', ['get', 'height_m'], heights[0]]]);
    } else {
      filter.push(['all', ['>=', ['get', 'height_m'], heights[0]], ['<=', ['get', 'height_m'], heights[1]]]);
    }
  }

  if (trees && trees.length > 0) {
    filter.push(['match', ['get', 'common_name'], trees, true, false]);
  }

  if (selected && selected.layer.id == LAYER_NAME) {
    filter.push(['!=', ['get', 'asset_id'], selected.properties.tree_id]);
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
export function toPrettyDateString(yyyymmdd: string) {
  let options: Intl.DateTimeFormatOptions = { weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric' };
  let split = yyyymmdd.split('-').map((elem) => { return parseInt(elem); });
  let date = new Date(split[0], split[1] - 1, split[2]);
  return date.toLocaleDateString('en-US', options);
}


// Zoom level display control helpers

/**
 * this may have performance problems when only a minimal filter is set and yet most trees
 * are still displayed. I could handle this by checking the contents of the filterObject
 * If it is filtering some trees then it's probably fine to allow low zoom levels (wide view)
 * if no trees are filtered an the diameter or height aren't very restricted, maybe don't allow
 * low zooms levels
 *
 * Something to think about
 */

 export function filterValidForWideZoom(filterObject: any) {
  return validTreesFilter(filterObject.trees) ||
         validDiameterFilter(filterObject.diameters) ||
         validHeightsFilter(filterObject.heights);
}

function validTreesFilter(trees: string[]) {
  return trees && trees.length > 0 && trees.length < 5;
}

function validDiameterFilter(diameters: number[]) {
  return diameters && ((diameters[1] - diameters[0]) <= 6);
}

function validHeightsFilter(heights: number[]) {
  return heights && ((heights[1] - heights[0]) <= 4);
}

