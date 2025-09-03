// config.js
const toNumber = (v, fallback) =>
  v != null ? Number(v) : fallback

const env = (process.env.NODE_ENV || 'dev').toLowerCase()

const redisConnection = env === 'prod'
  ? {
      host: process.env.REDIS_CLOUD_HOST,
      port: toNumber(process.env.REDIS_CLOUD_PORT, 6380),
      password: process.env.REDIS_CLOUD_ACCESS_KEY,
      tls: { servername: process.env.REDIS_CLOUD_HOST },
      retryStrategy: (times) => {
        console.log(`Redis retry (attempt ${times}), waiting 1500ms`)
        return 1500
      }
    }
  : {
      host: process.env.REDIS_LOCAL_HOST || '127.0.0.1',
      port: toNumber(process.env.REDIS_LOCAL_PORT, 6379),
      retryStrategy: (times) => {
        console.log(`Redis retry (attempt ${times}), waiting 1500ms`)
        return 1500
      }
    }

const redisConfig = redisConnection

const bullmqConfig = {
  connection: redisConnection,
  pingInterval: 1000
}

module.exports = { redisConfig, bullmqConfig }
