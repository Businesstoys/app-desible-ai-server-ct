const { Calls } = require('@/models')
const { db, voice } = require('@/service')
const { waitForTerminalViaStream, isTerminal } = require('./helper')

const initiate = async ({ _id }) => {
  try {
    const call = await db.findOne(Calls, { _id })
    if (!call) throw new Error(`call not found: ${_id}`)
    if (isTerminal(call?.status)) return

    const payload = {
      from_phone: '+19705125189',
      to_phone: '+919448795320',
      voice_agent: 'en-US-LunaNeural',
      dispatcher_name: 'Mike Johnson',
      carrier_name: 'ABC Transport',
      origin_city: 'Atlanta',
      destination_city: 'Miami',
      pickup_date: '30/08/2025',
      dot_number: '12378',
      mc_number: '4562',
      company_phone: '9447865310',
      load_id: '12A',
      email: 'test@gmail.com',
      booking_date: '28/08/2025'
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
