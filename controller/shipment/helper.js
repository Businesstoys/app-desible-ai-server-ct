const { CALL_STATUSES } = require('@/constant')
const { Calls, Statics } = require('@/models')
const { db } = require('@/service')
const { addJobToQueue } = require('@/service/bullmq/call/producer')
const { normalizePhone } = require('@/utils')

const mapShipmentPayload = (payload) => ({
  number: payload.Number,
  tripNumber: payload.TripNumber,
  status: payload.Status,
  rateType: payload.RateType,
  mode: payload.ModeId,
  modeId: payload.ModeId,

  plannedAt: payload.Planned ? new Date(payload.Planned) : undefined,
  shippedAt: payload.Shipped ? new Date(payload.Shipped) : undefined,
  pickedUpAt: payload.PickedUp ? new Date(payload.PickedUp) : undefined,
  deliveredAt: payload.Delivered ? new Date(payload.Delivered) : undefined,
  canceledAt: payload.Canceled ? new Date(payload.Canceled) : undefined,

  cost: payload.Cost,
  revenue: payload.Revenue,
  miles: payload.Miles,

  origin: {
    company: payload.Origin?.Company,
    street: payload.Origin?.Street,
    city: payload.Origin?.City,
    state: payload.Origin?.State,
    postalCode: payload.Origin?.PostalCode,
    country: payload.Origin?.Country || undefined
  },
  destination: {
    company: payload.Destination?.Company,
    street: payload.Destination?.Street,
    city: payload.Destination?.City,
    state: payload.Destination?.State,
    postalCode: payload.Destination?.PostalCode,
    country: payload.Destination?.Country || undefined
  },

  pickupWindow: {
    start: payload.PickupAppointmentWindowStart ? new Date(payload.PickupAppointmentWindowStart) : undefined,
    end: payload.PickupAppointmentWindowEnd ? new Date(payload.PickupAppointmentWindowEnd) : undefined
  },
  deliveryWindow: {
    start: payload.DeliveryAppointmentWindowStart ? new Date(payload.DeliveryAppointmentWindowStart) : undefined,
    end: payload.DeliveryAppointmentWindowEnd ? new Date(payload.DeliveryAppointmentWindowEnd) : undefined
  },

  equipment: {
    code: payload.RequestedEquipment?.Code,
    description: payload.RequestedEquipment?.Description
  },

  accountNumber: payload.Account?.Number,
  serviceTeam: payload.ServiceTeam?.Name,
  plannerEmail: payload.Planner?.Email,

  commodityCode: payload.CommodityCode,
  opCode: payload.OpCode,
  sourceSystem: payload.SourceSystem,

  carriers: (payload.Carriers || []).map(c => ({
    name: c.Name,
    dotNumber: c.CarrierId,
    phone: c.Phone || '',
    email: c.Email || '',
    probillNumber: c.ProbillNumber || '',
    tierOverride: c.TierOverride,
    tier: c?.Tier,
    dispatcherName: c?.DispatcherName
  })),

  referenceNumbers: (payload.ReferenceNumbers || []).map(r => ({
    code: r.Code,
    description: r.Description,
    value: r.Value
  })),

  invoices: (payload.Invoices || []).map(i => ({
    type: i.Type,
    originalInvoiceNumber: i.OriginalInvoiceNumber,
    invoiceNumber: i.InvoiceNumber,
    invoiceDate: i.InvoiceDate ? new Date(i.InvoiceDate) : undefined,
    totalAmount: i.TotalAmount,
    cost: i.Cost,
    isSupplementary: i.IsSupplementary,
    rowTimestampUtc: i.RowTimestampUtc ? new Date(i.RowTimestampUtc) : undefined
  })),

  stopSummary: {
    total: payload.Stops?.Total,
    extra: payload.Stops?.Extra
  },

  lastModifiedTimeUtc: payload.LastModifiedTimeUtc ? new Date(payload.LastModifiedTimeUtc) : undefined
})

async function createCallsForShipment (shipment, carriers) {
  for (const c of carriers) {
    const toPhone = normalizePhone(c.phone)
    if (!toPhone) continue

    // const filter = { status: CALL_STATUSES.QUEUED.QUEUED, toPhone }
    // const exists = await db.findOne(Calls, filter)
    // if (exists) continue

    const statics = await db.findOne(Statics, {}, { select: 'selectedNumber selectedVoice', lean: true })

    const call = await db.create(Calls, {
      toPhone,
      fromPhone: statics.selectedNumber,
      voice: statics.selectedVoice,
      status: CALL_STATUSES.QUEUED.QUEUED,
      carrierName: c.name,
      dotNumber: c.dotNumber,
      probillNumber: c.probillNumber,
      dispatcherName: c.dispatcherName,
      shipment: shipment._id,
      shipmentNumber: shipment.number,
      originCity: shipment?.origin?.city,
      destinationCity: shipment.destination.city,
      pickupDate: shipment.pickedUpAt,
      delivaryDate: shipment.deliveredAt
    })

    await addJobToQueue({
      jobId: `call:${call._id}`,
      data: { _id: String(call._id) }
    })
  }
}

module.exports = {
  mapShipmentPayload,
  createCallsForShipment
}
