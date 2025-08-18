const { Queue } = require('bullmq')
// const { redisConnection } = require('@/utils')

const { CALL_JOBS } = require('../names')

const queue = new Queue(CALL_JOBS, {
  ...require('../config')
})

queue.on('completed', (job, result) => {
  console.log(`Job completed with result ${result}`)
})

queue.on('failed', (job, err) => {
  console.error(`Job failed: ${err.message}`)
})

module.exports = queue
