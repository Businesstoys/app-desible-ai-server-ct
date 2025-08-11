const { Statics } = require('@/models')
const { db } = require('@/services')
const { AsyncWrapper } = require('@/utils')

const stopQueue = async (_, res) => {
  let statics = await db.findOne(Statics, {})
  if (!statics) {
    statics = await db.create(Statics, {})
  }
  statics.isQueueRunning = false
  await statics.save()

  res.status(200).json({
    status: 'success',
    isQueueRunning: statics.isQueueRunning,
    message: 'Queue stopped'
  })
}

const startQueue = async (_, res, next) => {
  let statics = await db.findOne(Statics, {})
  if (!statics) {
    statics = await Statics.create(Statics, {})
  }
  statics.isQueueRunning = true
  await statics.save()

  res.status(200).json({
    status: 'success',
    isQueueRunning: statics.isQueueRunning,
    message: 'Queue started'
  })
}

const getQueueStatus = async (req, res, next) => {
  let statics = await db.findOne(Statics, {})
  if (!statics) {
    statics = await db.create(Statics, {})
  }

  res.status(200).json({
    status: 'success',
    isQueueRunning: statics.isQueueRunning
  })
}

module.exports = AsyncWrapper({
  stopQueue,
  startQueue,
  getQueueStatus
})
