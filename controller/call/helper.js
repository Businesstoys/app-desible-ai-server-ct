const { Dispositions } = require('@/models')
const { db, voice } = require('@/service')
const { getRecordingUrl } = require('@/utils')

async function createDisposition (callId, summary) {
  return db.create(Dispositions, {
    call: callId,
    summary: summary?.summary,
    remark: summary?.remark,
    subRemark: summary?.sub_remark,
    receiver: summary?.receiver
  })
}

async function getCallSummaryForCall (call, transcriptionText) {
  const payload = {
    call_id: call.callId,
    transcription_text: transcriptionText,
    call_duration: call.duration,
    to_phone: call.toPhone
  }

  try {
    return await voice.getCallSummary(payload)
  } catch (err) {
    return { extracted_data: null }
  }
}

const handleCompletedCall = async (call) => {
  try {
    call.recordingUrl = getRecordingUrl(call.callId)

    let transcriptionText = call.transcriptionText || ''

    if (call.transcriptionId) {
      try {
        const response = await voice.getTranscription(call.transcriptionId)
        transcriptionText = response?.data ?? ''
        call.transcriptionText = transcriptionText
      } catch (err) {
        transcriptionText = ''
      }
    }

    if (transcriptionText) {
      const summary = await getCallSummaryForCall(call, transcriptionText)
      const extractedData = summary?.extracted_data || {}

      const disposition = await createDisposition(call._id, extractedData)
      call.disposition = disposition._id
    }
    await call.save()
  } catch (error) {
    // Silent catch to mirror original behavior.
    // Add logger here if needed.
  }
}

module.exports = {
  handleCompletedCall,
  getCallSummaryForCall,
  createDisposition
}
