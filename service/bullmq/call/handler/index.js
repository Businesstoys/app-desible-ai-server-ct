const { Calls } = require('@/models')
const { db, voice } = require('@/service')
const { waitForTerminalViaStream, isTerminal } = require('./helper')

const initiate = async ({ _id }) => {
  try {
    const call = await db.findOne(Calls, { _id })
    if (!call) throw new Error(`call not found: ${_id}`)
    if (isTerminal(call?.status)) return

    const payload = {
      from_phone: call.fromPhone,
      to_phone: call.toPhone,
      voice_agent: call.voice,
      dispatcher_name: 'Mike Johnson',
      carrier_name: call.carrierName,
      origin_city: call.originCity,
      destination_city: call.destinationCity,
      pickup_date: call.pickupDate,
      delivery_date: call.bookingDate
    }

    const response = await voice.initiateOutboundCall({ payload })

    if (response?.data?.call_sid) {
      Object.assign(call, {
        status: 'initiate',
        callId: response?.data?.call_sid || '',
        transcriptionId: response?.data?.transcription_id || '',
        initiatedAt: new Date()
      })
    } else {
      call.status = 'failed'
      call.initiatedAt = new Date()
    }
    await call.save()
  } catch (err) {
    await db.updateOne(
      Calls,
      { _id },
      { $set: { status: 'failed', initiatedAt: new Date() } }
    )
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
