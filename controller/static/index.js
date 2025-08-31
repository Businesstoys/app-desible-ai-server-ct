const { Statics } = require('@/models')
const { db } = require('@/service')
const { AsyncWrapper, AppError } = require('@/utils')

const stopQueue = async (_, res) => {
  const statics = await db.findOne(Statics, {})

  statics.isQueueRunning = false
  await statics.save()

  res.status(200).json({
    status: 'success',
    isQueueRunning: statics.isQueueRunning,
    message: 'Queue stopped'
  })
}

const startQueue = async (_, res) => {
  const statics = await db.findOne(Statics, {})

  statics.isQueueRunning = true
  await statics.save()

  res.status(200).json({
    status: 'success',
    isQueueRunning: statics.isQueueRunning,
    message: 'Queue started'
  })
}

const getQueueStatus = async (_, res) => {
  const statics = await db.findOne(Statics, {})

  res.status(200).json({
    status: 'success',
    isQueueRunning: statics.isQueueRunning
  })
}

const availableStatics = async (_, res, next) => {
  const statics = await db.findOne(Statics, {})

  if (statics) {
    return res.status(200).json({ status: 'success', data: statics || [] })
  } else {
    return next(new AppError('No Record Found.', 404))
  }
}

const config = async (req, res) => {
  const { prompt, voiceId, phoneNumber } = req.body

  const statics = await db.findOne(Statics, {})

  statics.prompt = prompt || statics.prompt
  statics.selectedVoice = voiceId
  statics.selectedNumber = phoneNumber

  await statics.save()

  res.status(201).json({ status: 'success' })
}

module.exports = AsyncWrapper({
  stopQueue,
  startQueue,
  getQueueStatus,
  availableStatics,
  config
})
