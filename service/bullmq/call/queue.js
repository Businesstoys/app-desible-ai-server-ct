const { Queue } = require('bullmq')
const redisConfig = require('@/service/config')

const { CALL_JOBS } = require('../names')

const queue = new Queue(CALL_JOBS, {
  ...redisConfig
})

queue.on('completed', (_, result) => {
  console.log(`Job completed with result ${result}`)
})

queue.on('failed', (_, err) => {
  console.error(`Job failed: ${err.message}`)
})

module.exports = queue
