const { Shipments } = require('@/models')

const { db } = require('@/service')
const { mapShipmentPayload, createCallsForShipment } = require('./helper')

const feed = async ({ body }, res) => {
  try {
    const mapped = mapShipmentPayload(body)

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

    await createCallsForShipment(shipment, shipment?.carriers)
    return res.status(200).json({ status: 'success' })
  } catch (error) {
    console.error('Webhook feed error:', error)
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error during webhook processing'
    })
  }
}

module.exports = { feed }
