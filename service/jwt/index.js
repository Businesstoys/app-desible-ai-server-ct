const jwt = require('jsonwebtoken')

const signToken = (id, expire) => new Promise((resolve, reject) => {
  jwt.sign(
    { id },
    process.env.JWT_SCERET,
    { expiresIn: expire || `${process.env.JWT_EXPIRES_IN}d` },
    function (err, token) {
      if (err) reject(err)
      resolve(token)
    }
  )
})

const verifyToken = (token) => new Promise((resolve, reject) => {
  jwt.verify(token, process.env.JWT_SCERET, function (err, decoded) {
    if (err) reject(err)
    resolve(decoded)
  })
})

module.exports = {
  signToken,
  verifyToken
}
