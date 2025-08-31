const moment = require('moment-timezone')
const { Calls, Dispositions } = require('@/models')
const { db } = require('..')
function isAllowedCallWindow (time, isOverride = false) {
  if (isOverride) return true

  const hour = time.hour()
  const minute = time.minute()
  const day = time.day() // 0 = Sunday

  if (day === 0) {
    // Sunday: 8:00 AM to 8:30 PM
    return hour >= 8 && (hour < 20 || (hour === 20 && minute <= 30))
  } else {
    // Weekdays & Saturday
    const inMorning = hour >= 8 && hour < 10
    const inEvening = (hour === 17 && minute >= 30) || (hour > 17 && hour < 20)
    return inMorning || inEvening
  }
}

async function prepareCallsForQueuing () {
  try {
    const now = moment.tz('Asia/Kolkata')

    const scheduledCalls = await db.find(Calls, {
      status: 'schedule',
      scheduledAt: { $lte: now.toDate() }
    })

    await Promise.all(
      scheduledCalls.map(async (call) => {
        const scheduledTime = moment(call.scheduledAt).tz('Asia/Kolkata')
        const overrideSlot = !isAllowedCallWindow(scheduledTime)

        const updatePayload = {
          status: 'queued',
          updatedOn: now.toDate(),
          overrideSlot,
          priority: 1
        }

        await db.updateOne(Calls, { _id: call._id }, { $set: updatePayload })
      })
    )
  } catch (error) {
    console.error('[prepareCallsForQueuing] Error:', error.message)
    throw error
  }
}

async function createDisposition (callId, summary) {
  return await db.create(Dispositions, {
    call: callId,
    summary: summary?.summary,
    remark: summary?.remark,
    subRemark: summary?.sub_remark,
    receiver: summary?.receiver,
    callbackDateTime: summary?.callback_datetime,
    classXPassStatus: summary?.class_x_pass_status,
    classXOverallMarks: summary?.class_x_overall_marks,
    postFailPlan: summary?.post_fail_plan,
    classXIAdmissionStatus: summary?.class_xi_admission_status,
    classXISchoolType1: summary?.class_xi_school_type_1,
    classXISchoolType2: summary?.class_xi_school_type_2,
    classXISchoolName: summary?.class_xi_school_name,
    classXIBoard: summary?.class_xi_board,
    classXIStreamChosen: summary?.class_xi_stream_chosen,
    dropOutAfterXReason: summary?.drop_out_after_x_reason,
    classXIAdmissionProof: summary?.class_xi_admission_proof
  })
}

module.exports = {
  isAllowedCallWindow,
  prepareCallsForQueuing,
  createDisposition
}
