/* eslint-disable camelcase */
const cron = require('node-cron')
const moment = require('moment-timezone')
const { db, voice } = require('..')
const { Calls, CallsLogs, Statics } = require('@/models')
const { getRecordingUrl, mapHangupCodeToCallStatus } = require('@/utils')
const { CALL_STATUSES, MAX_CALL_ATTEMPTS } = require('@/constant')
const { getNextBusinessRetryTime } = require('@/utils/scheduler')
const { prepareCallsForQueuing, isAllowedCallWindow, createDisposition } = require('./helper')

async function logCallEvent ({ log = 'info', content = '', callId = null }) {
  try {
    await db.create(CallsLogs, { log, content, callId })
  } catch (error) {
    console.error('Failed to create call log:', error)
  }
}

async function processQueuedCalls (queuedCalls) {
  return Promise.all(
    queuedCalls.map(async (call) => {
      const voiceId = call.template?.voices?.find(
        voice => voice._id.toString() === call.voiceId.toString()
      )?.value

      const parentCall = await db.findOne(
        Calls,
        { _id: call?.parentId || call?.chain[call?.chain.length - 1] },
        {
          populate: [
            { path: 'disposition', select: 'summary' }
          ]
        }
      )

      const payload = {
        from_phone: '+912269976257',
        to_phone: call?.toPhone,
        Voice_Name: voiceId,
        Agent_Name: call.agentName,
        Student_Name: call.studentName,
        School_Name: call.schoolName,
        Counselor_Name: call.counselorName,
        Location: call.location,
        Class: call.class,
        Gender: call.gender,
        UID: call.uid,
        Source: 'Desible_Platform',
        summary: parentCall?.disposition?.summary || ''
      }

      await logCallEvent({
        log: 'info',
        content: `Preparing to initiate call for ${call.id} with payload: ${JSON.stringify(payload)}`,
        callId: call._id
      })

      try {
        const response = await voice.initiateOutboundCall({ payload })
        await logCallEvent({
          log: 'info',
          content: `Received response from initiateOutboundCall: ${JSON.stringify(response?.data || {})}`,
          callId: call._id
        })

        if (response?.data?.call_sid) {
          const { call_sid, transcription_id } = response.data
          Object.assign(call, {
            status: 'initiate',
            callId: call_sid || '',
            transcriptionId: transcription_id || '',
            initiatedAt: new Date()
          })
          await logCallEvent({
            log: 'success',
            content: `Call initiated successfully with call_sid ${call_sid}`,
            callId: call._id
          })
        } else {
          call.status = 'failed'
          call.initiatedAt = new Date()
          if (call?.attempt < MAX_CALL_ATTEMPTS) {
            await handleCreateRetiryCall(call)
          }
          await logCallEvent({
            log: 'error',
            content: 'Call initiation failed - No call_sid in response',
            callId: call._id
          })
        }
      } catch (error) {
        console.error(`Failed to initiate call for: ${call.id}`, error.message)
        call.status = 'failed'
        call.initiatedAt = new Date()
        await logCallEvent({
          log: 'error',
          content: `Call initiation error: ${error.message}`,
          callId: call._id
        })
      }
      return call.save()
    })
  )
}

async function handleCompletedCall (call) {
  call.recordingUrl = getRecordingUrl(call.callId)
  await call.save()

  await logCallEvent({
    log: 'info',
    content: `Call completed. Recording URL: ${call.recordingUrl}`,
    callId: call._id
  })

  let summary = { retry: true }

  try {
    let transcriptionText = call.transcriptionText

    if (call.transcriptionId && !call.transcriptionText) {
      const response = await voice.getTranscription(call.transcriptionId)

      await logCallEvent({
        log: 'info',
        content: `Transcription response: ${JSON.stringify(response?.data || {})}`,
        callId: call._id
      })

      transcriptionText = response.data ?? ''
      call.transcriptionText = transcriptionText
      await call.save()
    }

    if (transcriptionText) {
      const payload = {
        call_id: call.callId,
        customer_name: call.studentName,
        transcription_text: transcriptionText,
        call_duration: call.duration,
        to_phone: call.toPhone
      }

      await logCallEvent({
        log: 'info',
        content: `Sending call summary request with payload: ${JSON.stringify(payload)}`,
        callId: call._id
      })

      summary = await voice.getCallSummary(payload)
      const extractedData = summary?.extracted_data || {}

      await logCallEvent({
        log: 'info',
        content: `Call summary response: ${JSON.stringify(summary)}`,
        callId: call._id
      })

      const disposition = await createDisposition(call._id, extractedData)
      call.disposition = disposition._id
      await call.save()

      await logCallEvent({
        log: 'success',
        content: 'Transcription and summary processed successfully',
        callId: call._id
      })
    }
    if (call?.attempt < MAX_CALL_ATTEMPTS && summary?.retry) {
      console.log('call schedule')
      await handleCreateRetiryCall(call, summary?.extracted_data?.callback_datetime)
    }
  } catch (error) {
    if (call?.attempt < MAX_CALL_ATTEMPTS) {
      await handleCreateRetiryCall(call)
    }
    await logCallEvent({
      log: 'error',
      content: `Error processing call: ${error.message}`,
      callId: call._id
    })
  }
}

async function updateCallStatus (call) {
  try {
    const { callId, status } = call
    const callDetailsResponse = await voice.getCallDetails(callId)

    await logCallEvent({
      log: 'info',
      content: `Call details response: ${JSON.stringify(callDetailsResponse || {})}`,
      callId: call._id
    })

    let newStatus = ''

    if (!callDetailsResponse?.call_sid) {
      const liveStatusResponse = await voice.getLiveStatus(callId)
      newStatus = liveStatusResponse?.call_status

      await logCallEvent({
        log: 'info',
        content: `Live status response: ${JSON.stringify(liveStatusResponse || {})}`,
        callId: call._id
      })
    } else {
      newStatus = mapHangupCodeToCallStatus(callDetailsResponse?.hangup_cause_code)
      if (newStatus === CALL_STATUSES.COMPLETED) {
        call.duration = callDetailsResponse.call_duration || ''
      }
    }

    if (status !== newStatus) {
      call.status = newStatus === 'queued' ? 'initiate' : newStatus
      await call.save()

      await logCallEvent({
        log: 'info',
        content: `Status updated to ${call.status}`,
        callId: call._id
      })
    }

    if (call.status === CALL_STATUSES.COMPLETED) {
      await handleCompletedCall(call)
    }

    if (CALL_STATUSES.FAILD_CALL.includes(call.status)) {
      if (call.attempt < MAX_CALL_ATTEMPTS) {
        await handleCreateRetiryCall(call)
      } else {
        await logCallEvent({
          log: 'info',
          content: 'Max retry attempts reached, call closed',
          callId: call._id
        })
      }
    }
  } catch (error) {
    console.error('Error updating call status:', error)
    await logCallEvent({
      log: 'error',
      content: `Error updating status: ${error.message}`,
      callId: call._id
    })
  }
}

async function handleCreateRetiryCall (call, callback_datetime = '') {
  try {
    let scheduledAt
    let phaseData = { }

    const tz = 'Asia/Kolkata'
    const phaseName = call.phase?.name
    const phaseAttempts = call.phase?.attempts || 0

    if (callback_datetime) {
      scheduledAt = moment.tz(callback_datetime, 'DD/MM/YYYY hh:mm A', tz).toDate()
      phaseData = { name: 'immediate', attempts: 0 }
    } else if (phaseName === 'immediate' && phaseAttempts < 4) {
      const lastInitiated = moment(call?.initiatedAt).tz(tz)
      scheduledAt = lastInitiated.clone().add(20, 'minutes').toDate()
      phaseData = { name: 'immediate', attempts: phaseAttempts + 1 }
    } else {
      scheduledAt = getNextBusinessRetryTime(call.initiatedAt || new Date())
      phaseData = { name: 'fallback', attempts: phaseAttempts }
    }

    const callData = {
      user: call.user,
      fromPhone: call.fromPhone,
      toPhone: call.toPhone,
      status: 'schedule',
      leadId: call.leadId,
      template: call.template,
      voiceId: call.voiceId,
      agentName: call.agentName,
      studentName: call.studentName,
      counselorName: call.counselorName,
      schoolName: call.schoolName,
      gender: call.gender,
      location: call.location,
      class: call.class,
      uid: call.uid,
      scheduledAt,
      attempt: call.attempt + 1,
      parentId: call._id,
      rootId: call.rootId || call._id,
      chain: [...(call.chain || []), call._id],
      priority: call?.phase?.name === 'immediate' ? 1 : 5,
      ...(phaseData ? { phase: phaseData } : {})
    }

    const newCall = await db.create(Calls, callData)
    await logCallEvent({
      log: 'info',
      content: `Retry scheduled at ${scheduledAt.toISOString()}. Attempt: ${callData.callAttempt}`,
      callId: newCall._id
    })
  } catch (error) {
    console.error('Error creating retry call:', error)
    await logCallEvent({
      log: 'error',
      content: `Error creating retry call: ${error.message}`,
      callId: call._id
    })
  }
}

const init = () => cron.schedule('*/30 * * * * *', async () => {
  try {
    const statics = await db.findOne(Statics, {})
    if (!statics?.isQueueRunning) return
    await prepareCallsForQueuing()

    const [ongoingCalls, queuedCalls] = await Promise.all([
      db.find(Calls, { status: { $in: CALL_STATUSES.ONGOING } }),
      db.find(Calls, { status: { $in: CALL_STATUSES.QUEUED } }, {
        sort: { priority: 1 },
        populate: [
          { path: 'template' },
          { path: 'disposition', select: 'summary' }
        ]
      })
    ])

    const MAX_SERVER_CAPACITY = Number(statics?.serverCapacity) || 1

    const remainingCapacity = MAX_SERVER_CAPACITY - (ongoingCalls?.length || 0)

    if (remainingCapacity > 0 && queuedCalls?.length > 0) {
      const currentTimeIST = moment.tz('Asia/Kolkata')
      const eligibleQueuedCalls = queuedCalls.filter(call =>
        isAllowedCallWindow(currentTimeIST, call?.overrideSlot)
      )
      const callsToProcess = eligibleQueuedCalls.slice(0, remainingCapacity)
      await processQueuedCalls(callsToProcess)
    }

    if (ongoingCalls.length > 0) {
      await Promise.all(ongoingCalls.map(updateCallStatus))
    }
  } catch (error) {
    console.error('Error during call status check:', error)
    await logCallEvent({
      log: 'error',
      content: `Cron execution failed: ${error.message}`
    })
  }
})

module.exports = { init }
