const cron = require('node-cron')
const { db } = require('..')
const { Calls } = require('@/models')
const { addJobToQueue } = require('../bullmq/call/producer')

const init = () => cron.schedule('*/30 * * * * *', async () => {
  try {
    const scheduledCalls = await db.find(Calls, {
      status: 'schedule',
      scheduledAt: { $lte: new Date() }
    })

    await Promise.all(
      scheduledCalls.map(async (call) => {
        addJobToQueue({
          jobId: `call:${call._id}`,
          data: { _id: String(call._id) }
        })
        db.updateOne(Calls,
          { _id: call._id },
          { $set: { status: 'queued', priority: 1 } })
      })
    )
  } catch (error) {
    console.log(error)
  }
})

module.exports = { init }
