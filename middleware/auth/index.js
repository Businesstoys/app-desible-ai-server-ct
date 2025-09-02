const twilio = require('twilio')

const { Users } = require('@/models')
const { jwt, db } = require('@/service')
const { AppError, AsyncWrapper } = require('@/utils')

const protect = async (req, _, next) => {
  const key = process.env.USER_KEY_COOKIE

  const authHeader = req.get('authorization') // ✅
  const tokenFromHeader = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader

  const token = tokenFromHeader || req.cookies?.[key] // requires cookie-parser
  console.log('Authorization Header:', authHeader)
  console.log('Token:', token)

  if (!token) return next(new AppError('Unauthorized', 401))

  try {
    const decoded = await jwt.verifyToken(token)
    const user = await db.findOne(Users, { _id: decoded.id })
    if (!user) return next(new AppError('Unauthorized', 401))
    await user.save()
    req.user = user
    next()
  } catch (err) {
    console.error('Token verification error:', err)
    next(new AppError('Invalid token', 401))
  }
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
