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

const availableStatics = async (req, res, next) => {
  try {
    let statics = await db.findOne(Statics, {})

    if (!statics) {
      statics = await db.create(Statics, {})
    }

    if (statics) {
      return res.status(200).json({ status: 'success', data: statics || [] })
    } else {
      return res.status(404).json({ status: 'false', message: 'Phone Numbers not Found', phoneNumbers: [] })
    }
  } catch (err) {
    console.log('Error', err)
    res.status(500).json({ status: 'error', message: 'Server error' })
  }
}

const config = async (req, res, next) => {
  try {
    const { prompt, voiceId, phoneNumber } = req.body
    console.log('Statics', prompt, voiceId, phoneNumber)
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
  } catch (err) {
    console.error('Error updating config:', err)
    res.status(500).json({ status: 'error', message: 'Server error updating config' })
  }
}

module.exports = AsyncWrapper({
  stopQueue,
  startQueue,
  getQueueStatus,
  availableStatics,
  config
})
