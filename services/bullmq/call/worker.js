// services/bullmq/worker.js
const { Worker } = require('bullmq')
const { CALL_JOBS } = require('../names')
const handler = require('./handler')

const worker = new Worker(
  CALL_JOBS,
  async (job) => {
    console.log(`Processing job ${job.id} with data:`, job.data)
    await handler.initiate(job.data)
    await handler.waitUntilTerminal(job.data)
  },
  {
    ...require('@/services/config').config,
    concurrency: 2
  }
)

worker.on('completed', (job) => {
  console.log(`Job completed: ${job.id}`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed: ${err.message}`)
})

worker.on('stalled', (jobId) => {
  console.warn(`Job stalled: ${jobId}`)
})

worker.on('error', (err) => {
  console.error('Worker error:', err)
})

const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}, closing worker...`)
  try {
    await worker.close()
  } finally {
    process.exit(0)
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

module.exports = worker
