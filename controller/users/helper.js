const moment = require('moment')
const { jwt } = require('@/services')

exports.setAuthToken = async ({
  user,
  res
}) => {
  try {
    const token = await jwt.signToken(user._id)
    const cookieOptions = {
      expires: moment().add(Number(process.env.JWT_EXPIRES_IN), 'days').toDate(),
      httpOnly: true,
      path: '/'
    }
    if (process.env.NODE_ENV === 'prod') cookieOptions.secure = true
    res.cookie(process.env.USER_KEY_COOKIE, token, cookieOptions)
    return { token, cookieOptions }
  } catch (error) {
    throw Error(error)
  }
}

exports.sendUserData = ({ user }) => {
  return {
    name: user.name,
    email: user.email
  }
}
