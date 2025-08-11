const { Organizations } = require('@/models')
const { db } = require('@/services')
const { AppError, AsyncWrapper } = require('@/utils')
const crypto = require('crypto')

const createOrganization = async ({ body }, res, next) => {
  const {
    name
  } = body

  if (!name) {
    return next(new AppError('Name is required.', 400))
  }

  const organizationInfo = await db.findOne(Organizations, { name })

  if (organizationInfo) return next(new AppError('Organization already Registered', 409))

  const organizationDetails = await db.create(Organizations, {
    name,
    clientId: crypto.randomBytes(16).toString('hex'),
    clientSecret: crypto.randomBytes(32).toString('hex')
  })

  if (!organizationDetails) {
    return next(new AppError('Something went wrong', 409))
  }

  res.status(200).json({
    status: 'success'
  })
}

module.exports = AsyncWrapper({
  createOrganization
})
