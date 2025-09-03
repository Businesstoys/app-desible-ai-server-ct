/**
 * Extracts the last segment of a path.
 * @param {string} path - The path string to extract from.
 * @returns {string} - The last segment of the path.
 */

module.exports = function (recordingId) {
  return `https://ct-api-h0bzdsbvcbewcpae.centralus-01.azurewebsites.net/api/v1/recording/${recordingId}`
}
