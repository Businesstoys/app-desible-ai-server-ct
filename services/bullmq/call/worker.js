const { Worker } = require('bullmq')
const { CALL_JOBS } = require('../names')
const handler = require('./handler')

const worker = new Worker(
  CALL_JOBS,
  async (job) => {
    try {
      await handler.initiate(job.data)
    } catch (error) {
      console.log({ error })
      await job.moveToFailed(error, job.data._id)
    }
  },
  {
    ...require('../config')
  }
)

worker.on('completed', async (job) => {
  console.log(`Job completed for ${job.id}`)
})

worker.on('failed', async (job, err) => {
  await handler.errorRunSimulated(job.data)
  console.error(`${job?.id} has failed with ${err.message}`)
})

worker.on('stalled', (str) => {
  console.log(`Job stalled: ${str}`)
})

const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}, closing server...`)
  await worker.close()
  process.exit(0)
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

module.exports = worker
