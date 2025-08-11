const axios = require('axios')
const { db } = require('..')
const { Calls, WebHooks } = require('@/models')

const callClientWebhook = async ({ callId, callStatus }) => {
  let call = null
  try {
    call = await db.findOne(Calls, { callId })

    if (!call) {
      console.error('Error: Call ID not found')
      return
    }

    const { organizationId, url, userId } = call

    if (!url || organizationId.toString() !== '66d050f77c43c7821394d241') return

    // Check if a webhook already exists for this call
    const existingWebhook = await db.findOne(WebHooks, { callId })
    if (existingWebhook) {
      console.error('Error: Webhook already exists for this call')
      return
    }

    // Create a webhook entry in the database
    const webhookDetails = await db.create(WebHooks, {
      organizationId,
      userId,
      callId
    })

    const headers = { 'Content-Type': 'application/json' }
    const payload = { callId, callStatus }

    // Send the webhook request
    const response = await axios.post(url, payload, { headers })

    // Update webhook details with response
    webhookDetails.statusCode = response?.status
    webhookDetails.responseBody = response?.data
    await webhookDetails.save()
  } catch (error) {
    console.error('Webhook call failed:', error.response?.data || error.message)

    // Create webhook entry with error details if call exists
    if (call) {
      const webhookDetails = await db.create(WebHooks, {
        organizationId: call.organizationId,
        userId: call.userId,
        callId,
        statusCode: error.response?.status || 500,
        errorMessage: error.response?.data || error.message
      })
      await webhookDetails.save()
    }
  }
}

module.exports = {
  callClientWebhook
}
