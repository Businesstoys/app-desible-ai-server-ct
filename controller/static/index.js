const { Statics } = require('@/models')
const { db } = require('@/services')
const { AsyncWrapper, AppError } = require('@/utils')

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

const availableStatics = async (req, res, next) => {
  let statics = await db.findOne(Statics, {})

  if (!statics) {
    statics = await db.create(Statics, {})
  }

  if (statics) {
    return res.status(200).json({ status: 'success', data: statics || [] })
  } else {
    return next(new AppError('No Record Found.', 404))
  }
}

const config = async (req, res, next) => {
  const { prompt, voiceId, phoneNumber } = req.body
  if (!voiceId || !phoneNumber) {
    return res.status().json({ status: false, message: 'Voice Id and Phone Number is required' })
  }

  let statics = await db.findOne(Statics, {})

  if (!statics) {
    statics = db.create(Statics, {})
  }

  statics.prompt = prompt || statics.prompt
  statics.selectedVoice = voiceId
  statics.selectedNumber = phoneNumber
  await statics.save()

  res.status(201).json({
    status: 'success',
    data: {
      selectedVoice: statics.selectedVoice,
      selectedNumber: statics.selectedNumber,
      prompt: statics.prompt
    },
    message: 'Configuration updated successfully'
  })
}

module.exports = AsyncWrapper({
  stopQueue,
  startQueue,
  getQueueStatus,
  availableStatics,
  config
})
