const toNumber = v => (v == null ? undefined : Number(v))

const configs = {
  dev: {
    connection: {
      host: process.env.REDIS_LOCAL_HOST || '127.0.0.1',
      port: toNumber(process.env.REDIS_LOCAL_PORT) || 6379
    }
  },
  prod: {
    connection: {
      host: process.env.REDIS_CLOUD_HOST,
      port: toNumber(process.env.REDIS_CLOUD_PORT) || 6380,
      password: process.env.REDIS_CLOUD_ACCESS_KEY,
      tls: { servername: process.env.REDIS_CLOUD_HOST }
    }
  }
}

const env = (process.env.NODE_ENV || 'dev').toLowerCase()
const envKey = env === 'dev' ? 'dev' : 'prod'
const selected = configs[envKey] || configs.dev

const baseConfig = {
  retryStrategy: (times) => {
    console.log(`Redis retry (attempt ${times}), waiting 1500ms`)
    return 1500
  },
  pingInterval: 1000
}

const bullmqConfig = { ...baseConfig, ...selected }
const redisConfig = { ...baseConfig, ...(selected.connection || {}) }

console.log({
  env,
  usingEnvKey: envKey,
  bullmqConnection: bullmqConfig.connection,
  redisConnection: {
    host: redisConfig.host,
    port: redisConfig.port,
    tls: redisConfig.tls ? { enabled: true, servername: redisConfig.tls.servername } : null
  }
})

module.exports = { bullmqConfig, redisConfig }
