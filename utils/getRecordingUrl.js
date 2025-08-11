/**
 * Extracts the last segment of a path.
 * @param {string} path - The path string to extract from.
 * @returns {string} - The last segment of the path.
 */

module.exports = function (recordingId) {
  return `https://api-idc.desible.ai/api/v1/recording/${recordingId}`
}
