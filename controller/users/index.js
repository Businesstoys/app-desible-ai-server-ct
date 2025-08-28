/* eslint-disable camelcase */
const { Users } = require('@/models')
const { db } = require('@/services')
const { AsyncWrapper, AppError, verifyMicrosoftToken } = require('@/utils')
const { sendUserData, setAuthToken } = require('./helper')

const login = async ({ body }, res, next) => {
  const { token } = body

  const decoded = await verifyMicrosoftToken(token)

  if (!decoded) {
    return next(new AppError('Invalid Microsoft token', 401))
  }

  const email = decoded?.email
  const user = await db.findOne(Users, { email })
  if (!user) return next(new AppError('User not found', 401))

  const { token: JwtToken, cookieOptions } = await setAuthToken({ user, res })

  res.status(200).json({
    status: 'success',
    token: JwtToken,
    cookieOptions,
    redirect: '/',
    user: sendUserData({ user })
  })
}

const create = async ({ body }, res, next) => {
  let { email, password, name, mobileNumber } = body

  email = `${email}`.trim()
  password = `${password}`.trim()
  name = `${name}`.trim()
  mobileNumber = `${mobileNumber}`.trim()

  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long', 400))
  }

  const existingUser = await db.findOne(Users, { email })
  if (existingUser) {
    return next(new AppError('Email already in use', 400))
  }

  const user = await db.create(Users, { email, password, name, mobileNumber })

  res.status(200).json({
    status: 'success',
    user: sendUserData({ user })
  })
}

module.exports = AsyncWrapper({
  login,
  create
})
