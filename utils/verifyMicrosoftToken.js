const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa')

const client = jwksClient({
  jwksUri: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
  cache: true,
  rateLimit: true
})

function getKey (header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err)
    const signingKey = key.getPublicKey()
    callback(null, signingKey)
  })
}

/**
 * Verify a Microsoft ID token
 * @param {string} idToken - The JWT from Microsoft
 * @returns {Promise<object>} - Decoded token claims
 */
module.exports = (idToken) => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getKey,
      {
        algorithms: ['RS256'],
        audience: process.env.MICROSOFT_CLIENT_ID
      },
      (err, decoded) => {
        if (err) return reject(err)
        resolve(decoded)
      }
    )
  })
}
