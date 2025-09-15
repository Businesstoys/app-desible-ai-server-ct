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
    await createLog({ log: 'info', content: `Incoming webhook: ${JSON.stringify(body)}` })

    const mapped = mapShipmentPayload(body)
    await createLog({ log: 'info', content: `Mapped shipment: ${JSON.stringify(mapped)}` })

    const shipment = await db.findOneAndUpdate(
      Shipments,
      { number: mapped.number },
      { $set: mapped },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    )

    await createLog({
      log: 'success',
      content: `Shipment saved/updated: ${shipment.number}`,
      callId: shipment._id
    })

    await createCallsForShipment(shipment, shipment?.carriers)

    await createLog({
      log: 'success',
      content: `Calls created for shipment: ${shipment.number}`,
      callId: shipment._id
    })

    return res.status(200).json({ status: 'success' })
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
