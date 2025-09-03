const { Calls } = require('@/models')
const { db } = require('@/service')
const { AsyncWrapper } = require('@/utils')
const moment = require('moment-timezone')

const attempts = async ({ query }, res) => {
  const { from, to } = query
  const filter = {}
  if (from && to) {
    const start = moment.tz(`${from} 00:00:00`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Kolkata').toDate()
    const end = moment.tz(`${to} 23:59:59.999`, 'YYYY-MM-DD HH:mm:ss.SSS', 'Asia/Kolkata').toDate()
    filter.createdOn = { $gte: start, $lte: end }
  }

  const pipeline = [
    {
      $match: {
        ...filter,
        status: { $in: ['completed', 'busy', 'not-reachable', 'no-answer', 'failed', 'cancelled', 'hang-up'] }
      }
    },
    {
      $group: {
        _id: { toPhone: '$toPhone', attempt: '$attempt' },
        status: { $first: '$status' }
      }
    },
    {
      $group: {
        _id: '$_id.attempt',
        total: { $sum: 1 },
        connected: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        notConnected: {
          $sum: { $cond: [{ $ne: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        attempt: '$_id',
        connectedPercentage: {
          $cond: [
            { $gt: ['$total', 0] },
            { $multiply: [{ $divide: ['$connected', '$total'] }, 100] },
            0
          ]
        },
        notConnectedPercentage: {
          $cond: [
            { $gt: ['$total', 0] },
            { $multiply: [{ $divide: ['$notConnected', '$total'] }, 100] },
            0
          ]
        },
        connected: 1,
        notConnected: 1,
        total: 1,
        _id: 0
      }
    },
    { $sort: { attempt: 1 } }
  ]

  const data = await db.aggregate(Calls, pipeline)

  const maxAttempt = 4
  const attemptMap = Object.fromEntries(data.map(d => [d.attempt, d]))
  const chartData = Array.from({ length: maxAttempt }, (_, i) => {
    const a = i + 1
    return attemptMap[a] || {
      attempt: a,
      connected: 0,
      notConnected: 0,
      total: 0,
      connectedPercentage: 0,
      notConnectedPercentage: 0
    }
  })

  res.json({ status: 'success', data: chartData })
}

const report = async ({ user, query }, res) => {
  const { from, to } = query
  const filter = { user: user._id }

  if (from && to) {
    const fromDate = new Date(from)
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999)
    filter.createdOn = { $gte: fromDate, $lte: toDate }
  }

  const data = await db.aggregate(
    Calls,
    [
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: { date: '$createdOn', timezone: 'UTC' } },
            month: { $month: { date: '$createdOn', timezone: 'UTC' } },
            day: { $dayOfMonth: { date: '$createdOn', timezone: 'UTC' } }
          },
          sampleDate: { $min: '$createdOn' },
          callsTriggered: { $sum: 1 },
          qualifiedCalls: {
            $sum: {
              $cond: [
                { $in: ['$remark', ['Interested', 'Language Barrier']] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: '%d %b',
              date: '$sampleDate',
              timezone: 'UTC'
            }
          },
          callsTriggered: 1,
          qualifiedCalls: 1
        }
      }
    ]
  )

  res.json({ status: 'success', data })
}

// statusReport: optimized + TZ-aware day bucketing
const statusReport = async ({ user, query }, res) => {
  const { from, to, tz = 'UTC' } = query

  // Build a TZ-aware $match using $dateFromString + $dateAdd so server TZ never leaks in
  const matchStage = (() => {
    if (!from || !to) return {}
    return {
      $expr: {
        $and: [
          {
            $gte: [
              '$createdOn',
              {
                $dateFromString: {
                  dateString: `${from}T00:00:00`,
                  timezone: tz
                }
              }
            ]
          },
          {
            $lt: [
              '$createdOn',
              {
                $dateAdd: {
                  startDate: {
                    $dateFromString: {
                      dateString: `${to}T00:00:00`,
                      timezone: tz
                    }
                  },
                  unit: 'day',
                  amount: 1
                }
              }
            ]
          }
        ]
      }
    }
  })()

  const pipeline = [
    Object.keys(matchStage).length ? { $match: matchStage } : null,
    {
      $addFields: {
        day: {
          $dateTrunc: { date: '$createdOn', unit: 'day', timezone: tz }
        }
      }
    },

    // Single pass pivot of statuses; this auto “sums the same date twice”
    {
      $group: {
        _id: '$day',
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        busy: {
          $sum: { $cond: [{ $eq: ['$status', 'busy'] }, 1, 0] }
        },
        no_answer: {
          $sum: { $cond: [{ $eq: ['$status', 'no-answer'] }, 1, 0] }
        },
        not_reachable: {
          $sum: { $cond: [{ $eq: ['$status', 'not-reachable'] }, 1, 0] }
        }
      }
    },

    // Sort by actual day, then format for display after sorting
    { $sort: { _id: 1 } },

    {
      $project: {
        _id: 0,
        date: {
          $dateToString: { format: '%d %b', date: '$_id', timezone: tz }
        },
        completed: 1,
        failed: 1,
        busy: 1,
        'no-answer': '$no_answer',
        'not-reachable': '$not_reachable'
      }
    }
  ].filter(Boolean)

  const data = await db.aggregate(Calls, pipeline)

  res.json({ status: 'success', data })
}

module.exports = AsyncWrapper({
  attempts,
  statusReport,
  report
})
