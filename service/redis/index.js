// services/redis/index.js
const IORedis = require('ioredis')
const redisConnetion = require('@/service/config')

let client

function getRedis () {
  if (!client) {
    client = new IORedis(redisConnetion)
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
  return client.xadd(
    `call:status:${String(callId)}`,
    'MAXLEN', '~', 200,
    '*',
    'status', String(status),
    'payload', JSON.stringify(payload || {})
  )
}

module.exports = { getRedis, xaddCallStatus }
