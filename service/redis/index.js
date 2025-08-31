const IORedis = require('ioredis')
const { config } = require('../config')

let redis
function getRedis () {
  if (!redis) {
    redis = new IORedis(config.connection)
    const close = async () => {
      try { await redis.quit() } catch {}
      process.exit(0)
    }
    process.on('SIGINT', () => close('SIGINT'))
    process.on('SIGTERM', () => close('SIGTERM'))
  }
  return redis
}

module.exports = { getRedis }
