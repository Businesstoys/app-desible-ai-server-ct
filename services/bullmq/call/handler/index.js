/* eslint-disable camelcase */
const { Calls } = require('@/models')
const { db, voice } = require('@/services')
const { logger } = require('@/utils/callLogger')

const initiate = async (data) => {
  const { callId } = data

  const call = await db.findOne(Calls, { _id: callId }, { populate: 'templateId' })
  if (!call) {
    const msg = `Call not found with ID: ${callId}`
    await logger.error(msg)
    throw new Error(msg)
  }

  const selectedVoice = call.templateId?.voices?.find(
    voice => voice._id.toString() === call.voiceId.toString()
  )

  const payload = {
    from_phone: '+918035738068',
    to_phone: call?.toPhone,
    Voice_Name: selectedVoice?.value,
    Agent_name: call.agentName,
    Customer_Name: call.customerName,
    email_address: call.email,
    pincode: call.pincode,
    Source: 'Desible_Platform'
  }

  await logger.info(`Initiating call for ${call._id}`, call._id)

  try {
    const response = await voice.initiateOutboundCall({ payload })

    if (response?.data?.call_sid) {
      const { call_sid, transcription_id } = response.data

      Object.assign(call, {
        callStatus: 'initiate',
        callId: call_sid || '',
        transcriptionId: transcription_id || '',
        initiatedAt: new Date()
      })

      await logger.success(`Call initiated for ${call._id} with call_sid ${call_sid}`, call._id)
    } else {
      call.callStatus = 'failed'
      call.initiatedAt = new Date()

      await logger.error(`Call initiation failed for ${call._id} - No call_sid`, call._id)
    }
  } catch (error) {
    call.callStatus = 'failed'
    call.initiatedAt = new Date()

    await logger.error(`Call initiation error for ${call._id}: ${error.message}`, call._id)
    throw error
  }

  await call.save()
}

module.exports = { initiate }
