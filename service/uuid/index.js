const { v4: uuidv4 } = require('uuid')
const TokenGenerator = require('uuid-token-generator')
const tokgen = new TokenGenerator()

const generateUUID = () => uuidv4()

const generateRandomToken = () => tokgen.generate()

const generateShortId = (_id) => {
  const id = _id
  const timestamp = id.getTimestamp().getTime().toString(36)
  const uniquePart = id.toString().slice(-3)
  return `${timestamp}${uniquePart}`.substring(0, 7)
}

module.exports = {
  generateUUID,
  generateRandomToken,
  generateShortId
}
