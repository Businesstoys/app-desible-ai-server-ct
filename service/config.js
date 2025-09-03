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
  pingInterval: 1000 // harmless if ignored
}

// Avoid spreading undefined
const merged = { ...baseConfig, ...(selected || {}) }

console.log({
  env,
  usingEnvKey: envKey,
  connection: {
    host: merged.connection?.host,
    port: merged.connection?.port,
    tls: merged.connection?.tls ? { enabled: true, servername: merged.connection.tls.servername } : null
  }
})

module.exports = merged
