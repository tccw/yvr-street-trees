
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
