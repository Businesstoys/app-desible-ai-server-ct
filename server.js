process.on('uncaughtException', (err) => {
  console.log({ err })
  process.exit(1)
})

require('module-alias/register')

const dotenv = require('dotenv')
dotenv.config({
  path: './.env'
})

const { db, cron } = require('./services')

db.init()
  .then(() => {
    cron.init()
  })
  .catch((err) => {
    console.log(err)
    process.exit(1)
  })

const app = require('./app')
const PORT = process.env.PORT || 8800

// SERVER INIT
const server = app.listen(PORT, () => {
  (process.env.NODE_ENV === 'dev')
    ? console.log(`Server up and running on http://localhost:${PORT}`)
    : console.log(`Server up and running on ${PORT}`)
})

process.on('unhandledRejection', (err) => {
  console.log({ err })
  server.close(() => {
    process.exit(1)
  })
})
