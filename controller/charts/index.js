const { Calls } = require('@/models')
const { db } = require('@/services')
const { AsyncWrapper } = require('@/utils')
const moment = require('moment-timezone')

const attempts = async ({ query, user }, res) => {
  const { from, to } = query
  const filter = { user: user._id }
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

  const maxAttempt = 15
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

const statusReport = async ({ user, query }, res) => {
  const { from, to } = query
  const filter = { userId: user._id }

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
            day: { $dayOfMonth: { date: '$createdOn', timezone: 'UTC' } },
            status: '$callStatus'
          },
          sampleDate: { $min: '$createdOn' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day',
            date: '$sampleDate'
          },
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
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
              date: '$_id.date',
              timezone: 'UTC'
            }
          },
          completed: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$statuses',
                    as: 'status',
                    cond: { $eq: ['$$status.status', 'completed'] }
                  }
                },
                as: 'filtered',
                in: '$$filtered.count'
              }
            }
          },
          failed: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$statuses',
                    as: 'status',
                    cond: { $eq: ['$$status.status', 'failed'] }
                  }
                },
                as: 'filtered',
                in: '$$filtered.count'
              }
            }
          },
          busy: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$statuses',
                    as: 'status',
                    cond: { $eq: ['$$status.status', 'busy'] }
                  }
                },
                as: 'filtered',
                in: '$$filtered.count'
              }
            }
          },
          'no-answer': {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$statuses',
                    as: 'status',
                    cond: { $eq: ['$$status.status', 'no-answer'] }
                  }
                },
                as: 'filtered',
                in: '$$filtered.count'
              }
            }
          },
          'not-reachable': {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$statuses',
                    as: 'status',
                    cond: { $eq: ['$$status.status', 'not-reachable'] }
                  }
                },
                as: 'filtered',
                in: '$$filtered.count'
              }
            }
          }
        }
      }
    ]
  )

  res.json({ status: 'success', data })
}

module.exports = AsyncWrapper({
  attempts,
  statusReport,
  report
})
