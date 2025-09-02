const twilio = require('twilio')

const { Users } = require('@/models')
const { jwt, db } = require('@/service')
const { AppError, AsyncWrapper } = require('@/utils')

const protect = async (req, _, next) => {
  const key = process.env.USER_KEY_COOKIE

  const token = req.header.authorization || req.cookies[key]
  console.log('Authorization Header:', req.header.authorization) // Debugging line to check the header
  console.log('Token:', token) // Debugging line to check the token value

  if (!token) return next(new AppError('Unauthorized', 401))

  console.log('Token found, proceeding to verify...') // Debugging line to confirm token presence

  let decoded
  try {
    decoded = await jwt.verifyToken(token)
    console.log('Token decoded:', decoded) // Debugging line to check decoded token
  } catch (error) {
    console.error('Token verification error:', error) // Debugging line to log verification errors
    return next(new AppError('Invalid token', 401))
  }

  const user = await db.findOne(Users, { _id: decoded.id })
  console.log('User found:', user) // Debugging line to check user retrieval
  if (!user) return next(new AppError('Unauthorized', 401))

  await user.save()
  req.user = user

  next()
}

const webhookProtect = (req, _, next) => {
  const secret = process.env.WEBHOOK_API_KEY

  if (!secret) {
    return next(new AppError('Unauthorized', 401))
  }

  const apiKey = req.get('x-api-key')
  if (!apiKey || apiKey !== secret) {
    return next(new AppError('Unauthorized', 401))
  }
  next()
}

const twilioWebhookProtect = (authToken = process.env.TWILIO_AUTH_TOKEN) => {
  return (req, res, next) => {
    try {
      if (!authToken) {
        return res.status(401).json({ error: 'Unauthorized: missing auth token' })
      }

      const signature = req.get('X-Twilio-Signature')
      if (!signature) {
        return res.status(401).json({ error: 'Unauthorized: missing signature' })
      }

      const protoHeader = req.get('X-Forwarded-Proto')
      const isSslOn = req.get('X-Forwarded-Ssl') === 'on'
      const protocol = protoHeader || (isSslOn ? 'https' : req.protocol)
      const host = req.get('X-Forwarded-Host') || req.get('Host')
      const fullUrl = `${protocol}://${host}${req.originalUrl}`

      const isValid = twilio.validateRequest(
        authToken,
        signature,
        fullUrl,
        req.body
      )

      if (!isValid) {
        return res.status(401).json({ error: 'Unauthorized: invalid signature' })
      }

      // request validated, continue
      next()
    } catch (err) {
      console.error('Twilio webhook validation error:', err)
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }
}

const asyncWrapped = AsyncWrapper({
  protect,
  webhookProtect
})

module.exports = {
  ...asyncWrapped,
  twilioWebhookProtect
}
