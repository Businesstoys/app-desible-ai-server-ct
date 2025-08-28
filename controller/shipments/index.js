const { Shipments } = require('@/models')

const { db } = require('@/services')
const { AsyncWrapper } = require('@/utils')
const { mapShipmentPayload, createCallsForShipment } = require('./helper')

const feed = async ({ body }, res) => {
  const mapped = mapShipmentPayload(body)
  const shipment = await db.findOneAndUpdate(
    Shipments,
    { number: mapped.number },
    { $set: mapped },
    { create: true, runValidators: true }
  )

  await createCallsForShipment(shipment, shipment?.carriers)

  return res.status(200).json({ status: 'success' })
}

module.exports = AsyncWrapper({
  feed
})
