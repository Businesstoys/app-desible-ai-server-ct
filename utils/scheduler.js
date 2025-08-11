// utils/scheduler.js
const moment = require('moment-timezone')

function getNextBusinessRetryTime (initiatedAt) {
  const tz = 'Asia/Kolkata'
  const start = moment(initiatedAt).tz(tz)
  const day = start.day() // 0 = Sunday
  const hour = start.hour()
  const minute = start.minute()

  let nextSlot

  if (day === 0) {
    // ----- SUNDAY -----
    const nextCall = start.clone().add(3, 'hours').second(0).millisecond(0)
    if (
      nextCall.hour() < 20 ||
      (nextCall.hour() === 20 && nextCall.minute() <= 30)
    ) {
      nextSlot = nextCall
    } else {
      // Move to Monday 8:00 AM
      nextSlot = start.clone().add(1, 'day').startOf('day').hour(8).minute(0).second(0)
    }
  } else {
    // ----- MONDAY to SATURDAY -----
    const inMorningSlot = hour >= 8 && hour < 10
    const inEveningSlot = (hour > 17 || (hour === 17 && minute >= 30)) && hour < 20

    if (inMorningSlot) {
      // Morning call → schedule evening
      nextSlot = start.clone().hour(17).minute(30).second(0)
    } else if (inEveningSlot) {
      // Evening call → schedule next day morning
      nextSlot = start.clone().add(1, 'day').hour(8).minute(0).second(0)
    } else if (hour < 8) {
      // Too early → morning slot
      nextSlot = start.clone().hour(8).minute(0).second(0)
    } else if (hour >= 10 && hour < 17) {
      // Between morning and evening slots → next evening
      nextSlot = start.clone().hour(17).minute(30).second(0)
    } else {
      // After 8:30 PM → next day morning
      nextSlot = start.clone().add(1, 'day').hour(8).minute(0).second(0)
    }
  }

  return nextSlot.toDate()
}

module.exports = { getNextBusinessRetryTime }
