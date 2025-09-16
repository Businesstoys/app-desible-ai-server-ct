/**
 * Normalize a phone number to E.164-like format (defaults to US).
 * - Strips non-digits
 * - If 11 digits starting with "1" → +1XXXXXXXXXX
 * - If 10 digits → +1XXXXXXXXXX
 * - Otherwise returns "+" + digits
 *
 * @param {string} p
 * @returns {string} normalized phone or empty string
 */
module.exports = (raw, defaultCountryCode = '+1') => {
  if (!raw) return ''

  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''

  if (digits?.length === 11 && digits?.startsWith('1')) {
    return '+' + digits
  }
  if (digits?.length === 10) {
    return defaultCountryCode + digits
  }

  return '+' + digits
}
