const XLSX = require('xlsx')

const { Calls } = require('@/models')
const { db, redis } = require('@/service')
const { AsyncWrapper, AppError, getDateRange } = require('@/utils')
const { CALL_STATUSES } = require('@/constant')
const { handleCompletedCall } = require('./helper')

const formatDate = (date) => {
  const d = new Date(date)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}-${mm}-${yy}`
}

const remove = async ({ user, params }, res, next) => {
  const { id } = params

  const call = await db.findOne(Calls, { _id: id, user: user._id })
  if (!call) return next(new AppError('Call not found', 404))

  await db.deleteOne(Calls, { _id: id })

  res.status(200).json({
    status: 'success',
    message: 'Call deleted successfully'
  })
}

const exportDetails = async (req, res, next) => {
  const { user } = req
  const {
    nin,
    startDate,
    endDate
  } = req.body

  const filter = { user: user._id }

  const { start, end } = getDateRange(startDate, endDate)
  filter.initiatedAt = { $gte: start, $lte: end }

  if (nin) {
    const statuses = nin.split(',').map(s => s.trim())
    filter.status = { $nin: statuses }
  }

  const calls = await db.find(Calls, filter, { sort: { initiatedAt: 1, createdOn: 1 }, populate: 'disposition' })

  if (!calls || calls.length === 0) {
    return next(new AppError('No call records found to export.', 404))
  }

  const workbook = XLSX.utils.book_new()

  const leadData = calls.map(item => ({
    'Lead Id': item?.leadId || 'N/A',
    'Student Name': item?.studentName || 'N/A',
    'Primary Mobile Number': item?.toPhone || 'N/A',
    'Created On': new Date(item.initiatedAt ?? item.createdOn).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  }))

  const leadSheet = XLSX.utils.json_to_sheet(leadData)
  XLSX.utils.book_append_sheet(workbook, leadSheet, 'Lead Data')

  let filename = 'call_logs_export.xlsx'

  if (startDate && endDate) {
    const fromFormatted = formatDate(startDate)
    const toFormatted = formatDate(endDate)
    filename = `call_logs_export_${fromFormatted}_to_${toFormatted}.xlsx`
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
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

const list = async ({ query, user }, res, _) => {
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
    outcome = ''
  } = query

  const pageNum = Math.max(1, parseInt(page, 10))
  const limit = Math.max(1, Math.min(100, parseInt(perPage, 10)))
  const skip = (pageNum - 1) * limit

  const filter = { }

  if (search) {
    const regex = { $regex: search, $options: 'i' }
    filter.$or = [
      { customerName: regex },
      { toPhone: regex },
      { status: regex },
      { studentName: regex }
    ]
  }

  if (agent !== 'all') {
    filter.agentName = agent
  }

  if (attempt !== 'all') {
    const attemptNum = Number(attempt)
    if (!isNaN(attemptNum)) {
      filter.attempt = attemptNum
    }
  }

  if (range !== 'all') {
    const days = parseInt(range, 10)
    if (!isNaN(days)) {
      filter.createdOn = { $gte: new Date(Date.now() - days * 86400000) }
    }
  }

  if (outcome && outcome !== 'All') {
    filter.outcome = outcome
  }

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

  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: 'dispositions',
        let: { callId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$call', '$$callId'] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 }
        ],
        as: 'disposition'
      }
    },
    {
      $unwind: {
        path: '$disposition',
        preserveNullAndEmptyArrays: true
      }
    },
    ...(remarkArray
      ? [{
          $match: {
            'disposition.remark': { $in: remarkArray }
          }
        }]
      : []),
    {
      $addFields: {
        effectiveDate: { $ifNull: ['$initiatedAt', '$createdOn'] }
      }
    },
    { $sort: { [sortField]: sortDirection } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'templates',
        localField: 'template',
        foreignField: '_id',
        as: 'template'
      }
    },
    {
      $unwind: {
        path: '$template',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'calls',
        localField: 'chain',
        foreignField: '_id',
        as: 'callHistory'
      }
    },
    {
      $project: {
        transcriptionId: 0
      }
    }
  ]

  const countPipeline = [
    { $match: filter },
    {
      $lookup: {
        from: 'dispositions',
        let: { callId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$call', '$$callId'] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 }
        ],
        as: 'disposition'
      }
    },
    {
      $unwind: {
        path: '$disposition',
        preserveNullAndEmptyArrays: true
      }
    },
    ...(remarkArray
      ? [{
          $match: {
            'disposition.remark': { $in: remarkArray }
          }
        }]
      : []),
    { $count: 'total' }
  ]

  const [data, countResult] = await Promise.all([
    db.aggregate(Calls, pipeline),
    db.aggregate(Calls, countPipeline)
  ])

  const total = countResult[0]?.total || 0
  const pageCount = Math.ceil(total / limit)

  const mapData = data.map(doc => {
    const voice = doc.template?.voices?.find(
      v => v._id.toString() === (doc.voiceId || '').toString()
    )

    return {
      _id: doc._id,
      toPhone: doc.toPhone,
      studentName: doc.studentName,
      agentName: doc.agentName,
      createdOn: doc.initiatedAt ?? doc.createdOn,
      templateId: doc.template?._id,
      template: doc.template?.name,
      voiceName: voice?.label || '—',
      callRecordingUrl: doc.recordingUrl,
      transcriptionText: doc.transcriptionText,
      gender: doc.gender,
      callDuration: doc.duration,
      callStatus: doc.status,
      scheduledAt: doc.scheduledAt,
      callAttempt: doc.attempt,
      shipmentNumber: doc.shipmentNumber,
      carrierName: doc.carrierName,
      probillNumber: doc.probillNumber,
      callHistory: doc.callHistory,
      remark: doc?.disposition?.remark,
      summary: doc?.disposition?.summary,
      subRemark: doc?.disposition?.subRemark,
      outcome: doc?.outcome,
      originCity: doc?.originCity,
      destinationCity: doc?.destinationCity,
      pickupDate: doc.pickupDate,
      delivaryDate: doc?.delivaryDate
    }
  })

  res.json({
    status: 'success',
    data: mapData,
    meta: {
      total,
      page: pageNum,
      perPage: limit,
      pageCount
    }
  })
}

const deleteCall = async ({ params }, res, next) => {
  const { id } = params

  const call = await db.findOne(Calls, { _id: id })
  if (!call) return next(new AppError('Call not found', 404))

  if (CALL_STATUSES.ONGOING.includes(call?.status)) {
    return next(new AppError('Call must be completed or failed to delete', 400))
  }

  await db.updateOne(Calls, { _id: id }, { $set: { status: 'deleted' } })

  res.status(200).json({
    status: 'success',
    message: 'Call deleted successfully'
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

    if (CALL_STATUSES.COMPLETED.COMPLETED === CallStatus) {
      call.duration = CallDuration
      await call.save()
      await redis.xaddCallStatus(_id, status, { status, _id })
      await handleCompletedCall(call)
    }

    return res.json({ ok: true })
  } catch (err) {
    console.error('updateStatus error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}

const asyncWrapped = AsyncWrapper({
  exportDetails,
  remove,
  kpi,
  list,
  deleteCall
})

module.exports = {
  ...asyncWrapped,
  updateStatus
}
