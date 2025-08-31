const path = require('path')
const express = require('express')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const expressFileUpload = require('express-fileupload')
const cors = require('cors')

const { AppError } = require('@/utils')
const morgan = require('morgan')

const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(cookieParser())

app.use(expressFileUpload())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// const allowedOrigins = [
//   'http://localhost:3000',
//   'https://white-rock-01b058f10.2.azurestaticapps.net'
// ]

app.use(cors({
  credentials: true,
  origin: function (origin, callback) {
    callback(null, origin || true)
  }
}))

app.use(morgan('dev'))

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress
  }
})

app.use(limiter)

app.post(
  '/webhooks/shipment',
  // require('@/middleware/auth').webhookProtect,
  require('./controller/shipment').feed
)

app.post(
  '/webhooks/twilio',
  // require('@/middleware/auth').twilioWebhookProtect(),
  require('./controller/call').updateStatus
)

const { bullboard } = require('@/service')
app.use('/admin/queues', bullboard.getRouter())

app.get('/', (req, res) => {
  res.status(200).json({ message: 'The server is up and running!' })
})

app.use('/', require('./routes'))

// 404 PAGE
app.use('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404))
})

app.use(require('./controller').error)

module.exports = app
