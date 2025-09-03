// services/redis/index.js
const IORedis = require('ioredis')
const { redisConfig } = require('@/service/config')
let client

function getRedis () {
  console.log('this is redis--------')
  console.log({ redisConfig })
  if (!client) {
    client = new IORedis(redisConfig)
    const close = async () => {
      try { await client.quit() } catch {}
      process.exit(0)
    }
    process.once('SIGINT', close)
    process.once('SIGTERM', close)
  }
  return client
}

async function xaddCallStatus (callId, status, payload = {}) {
  const redis = getRedis()
  return redis?.xadd(
    `call:status:${String(callId)}`,
    'MAXLEN', '~', 200,
    '*',
    'status', String(status),
    'payload', JSON.stringify(payload || {})
  )
}

module.exports = { getRedis, xaddCallStatus }
