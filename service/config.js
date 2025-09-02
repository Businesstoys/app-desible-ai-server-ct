const env = process.env.NODE_ENV || 'dev'

const configs = {
  dev: {
    connection: {
      host: process.env.REDIS_LOCAL_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_LOCAL_PORT || '6379', 10)
    }
  },
  prod: {
    connection: {
      host: process.env.REDIS_CLOUD_HOST,
      port: process.env.REDIS_CLOUD_PORT,
      password: process.env.REDIS_CLOUD_ACCESS_KEY,
      tls: true
    }
  }
}

console.log(process.env.REDIS_CLOUD_PORT)

const base = {
  retryStrategy: (times) => {
    console.log(`Redis retry (attempt ${times}), waiting 1500ms`)
    return 1500
  },
  pingInterval: 1000
}

const config = { ...base, ...configs[env] }
module.exports = { config }
