/* eslint-disable no-useless-escape */
const { CALL_STATUSES, MAX_CALL_ATTEMPT } = require('@/constant')
const { Dispositions, Calls } = require('@/models')
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
    console.log(err)
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
      call.outcome = disposition?.remark
    }
    await call.save()
  } catch (error) {
    console.log({ error })
    // Silent catch to mirror original behavior.
    // Add logger here if needed.
  }
}

const handleRetryCall = async (call) => {
  if (call.attempt >= MAX_CALL_ATTEMPT) return
  const scheduledAt = new Date(Date.now() + 2 * 60 * 1000)
  const { _id, createdOn, updatedAt, ...rest } = call.toObject ? call.toObject() : call

  const callData = {
    ...rest,
    attempt: (call.attempt ?? 0) + 1,
    scheduledAt,
    status: CALL_STATUSES.SCHEDULE,
    parentId: call._id,
    rootId: call.rootId || call._id,
    chain: [...(call.chain || []), call._id],
    priority: 1
  }

  console.log('call created')

  return db.create(Calls, callData)
}

module.exports = {
  handleCompletedCall,
  getCallSummaryForCall,
  createDisposition,
  handleRetryCall
}
