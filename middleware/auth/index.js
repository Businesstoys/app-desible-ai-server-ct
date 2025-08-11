const { Users } = require('@/models')
const { jwt, db } = require('@/services')
const { AppError, AsyncWrapper } = require('@/utils')

const protect = async (req, _, next) => {
  const key = process.env.USER_KEY_COOKIE

  const token = req.header.authorization || req.cookies[key]

  if (!token) return next(new AppError('Unauthorized', 401))

  let decoded
  try {
    decoded = await jwt.verifyToken(token)
  } catch (error) {
    return next(new AppError('Invalid token', 401))
  }

  const user = await db.findOne(Users, { _id: decoded.id })
  if (!user) return next(new AppError('Unauthorized', 401))

  await user.save()

  req.user = user

  next()
}

module.exports = AsyncWrapper({
  protect
})
