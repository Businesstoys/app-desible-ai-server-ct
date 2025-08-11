/* eslint-disable no-useless-escape */
module.exports = (phone) => {
  if (!phone) return null

  const phoneStr = String(phone)
    .trim()
    .replace(/[\s\-\(\)\.]/g, '')

  if (!/^[\+]?[\d]+$/.test(phoneStr)) {
    return null
  }

  if (/^\+91\d{10}$/.test(phoneStr)) {
    const firstDigit = phoneStr.charAt(3)
    if (['6', '7', '8', '9'].includes(firstDigit)) {
      return phoneStr
    }
    return phone
  }
  if (/^91\d{10}$/.test(phoneStr)) {
    const firstDigit = phoneStr.charAt(2)
    if (['6', '7', '8', '9'].includes(firstDigit)) {
      return `+${phoneStr}`
    }
    return phone
  }

  if (/^\d{10}$/.test(phoneStr)) {
    const firstDigit = phoneStr.charAt(0)
    if (['6', '7', '8', '9'].includes(firstDigit)) {
      return `+91${phoneStr}`
    }
    return phone
  }

  if (/^0\d{10}$/.test(phoneStr)) {
    const withoutZero = phoneStr.substring(1)
    const firstDigit = withoutZero.charAt(0)
    if (['6', '7', '8', '9'].includes(firstDigit)) {
      return `+91${withoutZero}`
    }
    return phone
  }

  return phone
}
