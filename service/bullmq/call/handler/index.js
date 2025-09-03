const { Calls } = require('@/models')
const { db, voice } = require('@/service')
const { waitForTerminalViaStream } = require('./helper')
const { CALL_STATUSES } = require('@/constant')

const BASE_URL = process.env.NODE_ENV === 'prod'
  ? process.env.APP_BASE_URL_PROD
  : process.env.APP_BASE_URL_DEV

const getWebhookUrl = (id) => `${BASE_URL}/webhooks/twilio?callId=${id}#rc=3&rp=all`

const initiate = async ({ _id }) => {
  try {
    const call = await db.findOne(Calls, { _id })
    if (!call) throw new Error(`call not found: ${_id}`)

    if (call?.status !== CALL_STATUSES.QUEUED.QUEUED) {
      throw new Error(`Call is not queued (current status: ${call.status})`)
    }

    const payload = {
      from_phone: call.fromPhone,
      to_phone: call.toPhone,
      voice_agent: call.voice,
      dispatcher_name: call.dispatcherName,
      carrier_name: call.carrierName,
      origin_city: call.originCity,
      destination_city: call.destinationCity,
      pickup_date: call.pickupDate,
      delivery_date: call.delivaryDate,
      webhookUrl: getWebhookUrl(call._id)
    }

    try {
      const response = await voice.initiateOutboundCall({ payload })
      if (response?.data?.Call_ID) {
        Object.assign(call, {
          status: 'initiate',
          callId: response?.data?.Call_ID || '',
          transcriptionId: response?.data?.Transcription_ID || '',
          initiatedAt: new Date()
        })
      }
    } catch (error) {
      await db.updateOne(
        Calls,
        { _id },
        { $set: { status: 'failed', initiatedAt: new Date() } }
      )
    }

    await call.save()
  } catch (err) {
    console.error(`initiate error for call ${_id}:`, err.message)
    throw err
  }
}

const waitUntilTerminal = async ({ _id }) => {
  const preCheck = async () => {
    const doc = await db.findOne(Calls, { _id })
    return doc || {}
  }
  await waitForTerminalViaStream(String(_id), { timeoutMs: 15 * 60 * 1000, preCheck })
}

module.exports = { initiate, waitUntilTerminal }
