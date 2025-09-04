/* eslint-disable no-useless-escape */
const XLSX = require('xlsx')

const { Calls, Statics } = require('@/models')
const { db, redis } = require('@/service')
const { AsyncWrapper, AppError, getDateRange, normalizePhone } = require('@/utils')
const { CALL_STATUSES } = require('@/constant')
const { handleCompletedCall, handleRetryCall } = require('./helper')
const { addJobToQueue } = require('@/service/bullmq/call/producer')

const moment = require('moment-timezone')

const BUSINESS_TZ = 'America/Chicago'
const hasOffsetOrZ = s => /[zZ]|[+\-]\d{2}:\d{2}$/.test(s)

function toUtcDate (input, zone = BUSINESS_TZ) {
  if (!input) return undefined
  const s = String(input).trim()
  const m = hasOffsetOrZ(s) ? moment.parseZone(s) : moment.tz(s, zone)
  if (!m.isValid()) return undefined
  return m.utc().toDate()
}

const list = async ({ query }, res, _) => {
  const {
    search = '',
    range = 'all',
    agent = 'all',
    attempt = 'all',
    in: inStatus,
    nin: ninStatus,
    page = 1,
    perPage = 10,
    remark = 'all',
    sortBy = 'effectiveDate',
    sortOrder = 'desc',
    outcome = 'all'
  } = query

  const pageNum = Math.max(1, parseInt(page, 10))
  const limit = Math.max(1, Math.min(100, parseInt(perPage, 10)))
  const skip = (pageNum - 1) * limit

  const filter = {}

  if (search) {
    const regex = { $regex: search, $options: 'i' }
    filter.$or = [
      { shipmentNumber: regex },
      { toPhone: regex },
      { status: regex },
      { studentName: regex }
    ]
  }

  if (agent !== 'all') filter.agentName = agent

  if (attempt !== 'all') {
    const attemptNum = Number(attempt)
    if (!isNaN(attemptNum)) filter.attempt = attemptNum
  }

  if (range !== 'all') {
    const days = parseInt(range, 10)
    if (!isNaN(days)) filter.createdOn = { $gte: new Date(Date.now() - days * 86400000) }
  }

  if (outcome && outcome !== 'all') filter.outcome = outcome

  if (inStatus) {
    filter.status = { $in: inStatus.split(',').map(s => s.trim()) }
  } else if (ninStatus) {
    filter.status = { $nin: ninStatus.split(',').map(s => s.trim()) }
  }

  const remarkArray = remark !== 'all'
    ? remark?.split(',').map(r => r.trim()).filter(Boolean)
    : null

  const validSortFields = ['effectiveDate', 'duration']
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'effectiveDate'
  const sortDirection = sortOrder === 'asc' ? 1 : -1

  const baseStages = [
    { $match: filter },
    {
      $lookup: {
        from: 'dispositions',
        let: { callId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$call', '$$callId'] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
          { $project: { remark: 1, summary: 1, subRemark: 1, _id: 0 } }
        ],
        as: 'disposition'
      }
    },
    { $unwind: { path: '$disposition', preserveNullAndEmptyArrays: true } },
    ...(remarkArray ? [{ $match: { 'disposition.remark': { $in: remarkArray } } }] : []),
    {
      $addFields: {
        effectiveDate: { $ifNull: ['$initiatedAt', '$createdOn'] }
      }
    }
  ]
  const dataPipeline = [
    ...baseStages,
    { $sort: { [sortField]: sortDirection } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        toPhone: 1,
        createdOn: { $ifNull: ['$initiatedAt', '$createdOn'] },
        callRecordingUrl: '$recordingUrl',
        transcriptionText: '$transcriptionText',
        callDuration: '$duration',
        callStatus: '$status',
        scheduledAt: 1,
        callAttempt: '$attempt',
        shipmentNumber: 1,
        carrierName: 1,
        probillNumber: 1,
        dispatcherName: 1,
        remark: '$disposition.remark',
        summary: '$disposition.summary',
        subRemark: '$disposition.subRemark',
        outcome: 1,
        originCity: 1,
        destinationCity: 1,
        pickupDate: 1,
        delivaryDate: 1,
        chain: 1
      }
    },
    {
      $lookup: {
        from: 'calls',
        localField: 'chain',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              _id: 1,
              status: 1,
              createdOn: 1,
              duration: 1
            }
          }
        ],
        as: 'callHistory'
      }
    },
    { $project: { chain: 0 } }
  ]

  const countPipeline = [...baseStages, { $count: 'total' }]

  const [data, countResult] = await Promise.all([
    db.aggregate(Calls, dataPipeline),
    db.aggregate(Calls, countPipeline)
  ])

  const total = countResult[0]?.total || 0
  const pageCount = Math.ceil(total / limit)

  res.json({
    status: 'success',
    data,
    meta: {
      total,
      page: pageNum,
      perPage: limit,
      pageCount
    }
  })
}

const remove = async ({ body }, res, next) => {
  const { id } = body

  const result = await db.updateMany(
    Calls,
    { _id: id },
    { $set: { status: 'deleted' } }
  )

  if (!result?.matchedCount) {
    return next(new AppError('Call not found', 404))
  }

  res.status(200).json({
    status: 'success',
    message: result?.matchedCount > 1 ? 'Calls deleted successfully' : 'Call deleted successfully'
  })
}

const exportDetails = async (req, res, next) => {
  const {
    nin,
    startDate,
    endDate
  } = req.body

  const filter = {}

  const { start, end } = getDateRange(startDate, endDate)
  filter.initiatedAt = { $gte: start, $lte: end }

  if (nin) {
    const statuses = nin.split(',').map(s => s.trim())
    filter.status = { $nin: statuses }
  }

  const calls = await db.find(Calls,
    filter,
    {
      sort: { initiatedAt: 1, createdOn: 1 },
      populate: 'disposition'
    }
  )

  if (!calls || calls.length === 0) {
    return next(new AppError('No call records found to export.', 404))
  }

  const workbook = XLSX.utils.book_new()
  const leadData = calls.map(item => ({
    shipmentNumber: item?.shipmentNumber || 'N/A',
    carrierName: item?.carrierName,
    summary: item?.dispostion?.summary,
    remark: item?.dispostion?.remark,
    CreatedOn: new Date(item.initiatedAt ?? item.createdOn)
  }))

  const leadSheet = XLSX.utils.json_to_sheet(leadData)
  XLSX.utils.book_append_sheet(workbook, leadSheet, 'Lead Data')

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=\'call_logs_export.xlsx')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  res.send(buffer)
}

const kpi = async ({ query }, res) => {
  const { from, to } = query

  const currentMatch = {}

  if (from && to) {
    const { start, end } = getDateRange(from, to)
    currentMatch.initiatedAt = { $gte: start, $lte: end }
  }

  const pipeline = (match) => [
    {
      $match: {
        ...match,
        status: { $nin: ['pending', 'deleted', 'schedule'] }
      }
    },
    {
      $lookup: {
        from: 'dispositions',
        localField: '_id',
        foreignField: 'call',
        as: 'disposition'
      }
    },
    {
      $unwind: {
        path: '$disposition',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $addFields: {
        callDurationSec: {
          $convert: {
            input: '$duration',
            to: 'int',
            onError: 0,
            onNull: 0
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        connectedCalls: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        qualifiedCalls: {
          $sum: {
            $cond: [
              { $eq: ['$disposition.remark', 'All Details Collected'] },
              1,
              0
            ]
          }
        },
        transferredCalls: {
          $sum: {
            $cond: [
              { $eq: ['$disposition.remark', 'Call Back'] },
              1,
              0
            ]
          }
        },
        totalDurationSec: { $sum: '$callDurationSec' },
        engagedCalls: {
          $sum: {
            $cond: [
              { $gt: ['$callDurationSec', 60] },
              1,
              0
            ]
          }
        },
        callsMoreThan1Min: {
          $sum: {
            $cond: [
              { $gt: ['$callDurationSec', 60] },
              1,
              0
            ]
          }
        },
        uniquePhones: { $addToSet: '$toPhone' },
        uniqueConnectedPhones: {
          $addToSet: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              '$toPhone',
              '$$REMOVE'
            ]
          }
        }
      }
    },
    {
      $project: {
        totalCalls: 1,
        connectedCalls: 1,
        qualifiedCalls: 1,
        transferredCalls: 1,
        totalDurationSec: 1,
        callsMoreThan1Min: 1,
        totalMinutesConsumed: {
          $ceil: { $divide: ['$totalDurationSec', 60] }
        },
        callsMoreThan1MinRateOfConnected: {
          $cond: [
            { $gt: ['$connectedCalls', 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$callsMoreThan1Min', '$connectedCalls'] },
                    100
                  ]
                },
                0
              ]
            },
            0
          ]
        },
        uniqueCalls: { $size: '$uniquePhones' },
        uniqueConnectedCount: { $size: '$uniqueConnectedPhones' },
        qualificationRate: {
          $cond: [
            { $gt: [{ $size: '$uniqueConnectedPhones' }, 0] },
            {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        '$qualifiedCalls',
                        { $size: '$uniqueConnectedPhones' }
                      ]
                    },
                    100
                  ]
                },
                0
              ]
            },
            0
          ]
        },
        connectedRate: {
          $cond: [
            { $gt: [{ $size: '$uniquePhones' }, 0] },
            {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        { $size: '$uniqueConnectedPhones' },
                        { $size: '$uniquePhones' }
                      ]
                    },
                    100
                  ]
                },
                0
              ]
            },
            0
          ]
        }
      }
    }
  ]

  const [curr = {}] = await db.aggregate(Calls, pipeline(currentMatch))

  const current = {
    totalCalls: curr.totalCalls || 0,
    connectedCalls: curr.uniqueConnectedCount || 0,
    averageCallDurationSec: curr.connectedCalls > 0
      ? Math.floor(curr.totalDurationSec / curr.connectedCalls)
      : 0,
    totalQualifiedLeads: curr.qualifiedCalls || 0,
    totalMinutesConsumed: curr.totalMinutesConsumed || 0,
    engagementRate: curr.engagementRate || 0,
    totalFeedbackRating: Math.round(curr.totalFeedbackRating || 0),
    uniqueCalls: curr.uniqueCalls || 0,
    qualificationRate: curr.qualificationRate || 0,
    totalCallsMoreThan1Min: curr.callsMoreThan1Min || 0,
    connectedRate: curr.connectedRate || 0,
    callsMoreThan1MinRateOfConnected: curr.callsMoreThan1MinRateOfConnected || 0
  }

  res.json({
    status: 'success',
    data: {
      totalCalls: { value: current.totalCalls },
      connectedCalls: { value: current.connectedCalls },
      pickupRate: { value: current.pickupRate },
      averageCallDurationSec: { value: current.averageCallDurationSec },
      totalQualifiedLeads: { value: current.totalQualifiedLeads },
      totalMinutesConsumed: { value: current.totalMinutesConsumed },
      transferRate: { value: current.transferRate },
      engagementRate: { value: current.engagementRate },
      uniqueCalls: { value: current.uniqueCalls },
      qualificationRate: { value: current.qualificationRate },
      totalCallsMoreThan1Min: { value: current.totalCallsMoreThan1Min },
      connectedRate: { value: current.connectedRate },
      callsMoreThan1MinRateOfConnected: {
        value: current.callsMoreThan1MinRateOfConnected
      }
    }
  })
}

const updateStatus = async (req, res) => {
  try {
    const { CallStatus, CallSid, CallDuration } = req.body
    const { callId } = req.query

    if (!CallStatus || !CallSid) {
      return res.status(400).json({ error: 'callStatus and callSid are required' })
    }

    const call = await db.findOneAndUpdate(
      Calls,
      { _id: callId },
      { $set: { status: CallStatus } },
      { new: true }
    )

    if (!call) {
      return res.status(404).json({ error: 'Call not found' })
    }

    const { status, _id } = call

    if (CALL_STATUSES.FAILED_LIST.includes(CallStatus)) {
      await redis.xaddCallStatus(_id, status, { status, _id })
      await handleRetryCall(call)
    }

    if (CALL_STATUSES.COMPLETED.COMPLETED === CallStatus) {
      call.duration = CallDuration
      await call.save()
      await handleCompletedCall(call)
      await redis.xaddCallStatus(_id, status, { status, _id })
    }

    return res.json({ ok: true })
  } catch (err) {
    console.error('updateStatus error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

const trackShipment = async (req, res) => {
  const { toPhone, dispatcherName, destination, origin, pickupDate, deliveryDate, carrierName } = req.body

  const shipmentId = '68b65a476edcc592ad7ee1f6'
  const shipmentNumber = '1158932444'

  const statics = await db.findOne(
    Statics,
    {},
    {
      select: { selectedNumber: 1, selectedVoice: 1 },
      lean: true
    }
  )

  if (!statics) {
    return res.status(500).json({ status: 'error', message: 'Caller config not found' })
  }

  const call = await db.create(Calls, {
    toPhone: normalizePhone(toPhone),
    fromPhone: statics.selectedNumber,
    voice: statics.selectedVoice,
    status: CALL_STATUSES.QUEUED.QUEUED,
    carrierName,
    dispatcherName,
    shipment: shipmentId,
    shipmentNumber,
    originCity: origin,
    destinationCity: destination,
    pickupDate: toUtcDate(pickupDate),
    delivaryDate: toUtcDate(deliveryDate)
  })

  await addJobToQueue({
    jobId: `call:${call._id}`,
    data: { _id: String(call._id) }
  })

  return res.status(200).json({
    status: 'success',
    message: 'Call intiated successfully'
  })
}

const asyncWrapped = AsyncWrapper({
  exportDetails,
  remove,
  kpi,
  list,
  trackShipment
})

module.exports = {
  ...asyncWrapped,
  updateStatus
}
