const { Shipments, CallLogs } = require('@/models')
const { db } = require('@/service')
const { mapShipmentPayload, createCallsForShipment } = require('./helper')

const createLog = async ({ log, content, callId = null }) => {
  try {
    await db.create(CallLogs, { log, content, callId })
  } catch (err) {
    console.error('Failed to create log:', err.message)
  }
}

const feed = async ({ body }, res) => {
  try {
    const items = Array.isArray(body) ? body : [body]

    if (!items || items.length === 0) {
      await createLog({ log: 'info', content: 'Incoming webhook: empty payload' })
      return res.status(400).json({ status: 'error', message: 'Empty payload' })
    }

    await createLog({
      log: 'info',
      content: `Incoming webhook (${items.length} item${items.length > 1 ? 's' : ''}): ${JSON.stringify(body)}`
    })

    const summary = { total: items.length, success: 0, failed: 0, details: [] }

    for (let i = 0; i < items.length; i++) {
      const raw = items[i]
      const prefix = `[item ${i}]`

      try {
        const mapped = mapShipmentPayload(raw)
        await createLog({ log: 'info', content: `${prefix} Mapped shipment: ${JSON.stringify(mapped)}` })

        const shipment = await db.create(Shipments, mapped)

        await createLog({
          log: 'success',
          content: `${prefix} Shipment saved/updated: ${shipment.number}`,
          callId: shipment._id
        })

        await createCallsForShipment(shipment, shipment?.carriers)

        await createLog({
          log: 'success',
          content: `${prefix} Calls created for shipment: ${shipment.number}`,
          callId: shipment._id
        })

        summary.success++
        summary.details.push({ status: 'success', number: shipment.number })
      } catch (err) {
        console.error('Webhook item error:', err)
        await createLog({
          log: 'error',
          content: `${prefix} Error: ${err.message || 'Unknown error'}`
        })

        summary.failed++
        summary.details.push({ status: 'error', error: err.message || 'Unknown error' })
      }
    }

    await createLog({
      log: summary.failed ? 'warn' : 'success',
      content: `Batch processed. Total: ${summary.total}, Success: ${summary.success}, Failed: ${summary.failed}`
    })

    const httpStatus = summary.failed ? 207 : 200
    return res.status(httpStatus).json({ status: summary.failed ? 'partial' : 'success', summary })
  } catch (error) {
    console.error('Webhook feed error:', error)
    await createLog({ log: 'error', content: `Webhook feed error: ${error.message}` })

    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error during webhook processing'
    })
  }
}

module.exports = { feed }
