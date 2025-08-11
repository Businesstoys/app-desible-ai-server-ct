const plivo = require('plivo')

// Replace with your Plivo credentials
const authId = ''
const authToken = ''

const client = new plivo.Client(authId, authToken)

async function getCallDetails (callUUID) {
  try {
    const response = await client.calls.get(callUUID)
    return response
  } catch (error) {
    console.error('Error fetching call details:', error)
  }
}

module.exports = {
  getCallDetails
}
