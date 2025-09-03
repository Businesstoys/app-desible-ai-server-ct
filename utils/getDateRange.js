const moment = require('moment-timezone')

/**
 * Returns a date range filter for MongoDB queries.
 *
 * @param {string} from - Start date (YYYY-MM-DD)
 * @param {string} to - End date (YYYY-MM-DD)
 * @param {string} timezone - IANA timezone string (default "Asia/Kolkata")
 * @returns {Object} -  range filter, e.g., { start,end }
 */
module.exports = (from, to, timezone) => {
  if (!from || !to) return {}
  const tz = timezone || moment.tz.guess()
  const start = moment.tz(`${from} 00:00:00`, 'YYYY-MM-DD HH:mm:ss', tz).toDate()
  const end = moment.tz(`${to} 23:59:59.999`, 'YYYY-MM-DD HH:mm:ss.SSS', tz).toDate()

  return { start, end }
}
