const mongoose = require('mongoose')
const { Schema } = mongoose

const shipmentSchema = new Schema(
  {
    number: { type: String, required: true, unique: true },
    tripNumber: { type: String },
    status: { type: String, enum: ['Planned', 'Billed', 'Delivered', 'Cancelled'] },

    rateType: { type: String },
    mode: { type: String },
    modeId: { type: String },

    plannedAt: { type: Date },
    shippedAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    canceledAt: { type: Date },

    cost: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    miles: { type: Number },

    origin: {
      company: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String }
    },
    destination: {
      company: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String }
    },

    pickupWindow: {
      start: { type: Date },
      end: { type: Date }
    },
    deliveryWindow: {
      start: { type: Date },
      end: { type: Date }
    },

    equipment: {
      code: { type: String },
      description: { type: String }
    },

    accountNumber: { type: String },
    serviceTeam: { type: String },
    plannerEmail: { type: String },

    commodityCode: { type: String },
    opCode: { type: String },
    sourceSystem: { type: String },

    carriers: [
      {
        name: { type: String }, // Name
        carrierId: { type: String }, // CarrierId (keep original)
        dotNumber: { type: String }, // optional mirror of carrierId if it’s DOT
        phone: { type: String }, // Phone
        email: { type: String }, // Email
        probillNumber: { type: String }, // ProbillNumber
        tierOverride: { type: String },
        tier: { type: String },
        dispatcherName: { type: String }
      }
    ],

    referenceNumbers: [
      {
        code: { type: String },
        description: { type: String },
        value: { type: String }
      }
    ],

    invoices: [
      {
        type: { type: Number }, // Type
        invoiceNumber: { type: String }, // InvoiceNumber
        originalInvoiceNumber: { type: String }, // OriginalInvoiceNumber
        invoiceDate: { type: Date }, // InvoiceDate
        totalAmount: { type: Number }, // TotalAmount
        cost: { type: Number }, // Cost
        isSupplementary: { type: Boolean }, // IsSupplementary
        rowTimestampUtc: { type: Date } // RowTimestampUtc
      }
    ],

    stopSummary: { // from Stops
      total: { type: Number }, // Total
      extra: { type: Number } // Extra
    },

    lastModifiedTimeUtc: { type: Date } // LastModifiedTimeUtc
  },
  {
    timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' },
    versionKey: false
  }
)

shipmentSchema.index({ number: 1 }, { unique: true })
shipmentSchema.index({ 'carriers.dotNumber': 1 })
shipmentSchema.index({ plannerEmail: 1 })
shipmentSchema.index({ status: 1, deliveredAt: 1 })
shipmentSchema.index({ 'invoices.invoiceNumber': 1 })

module.exports = mongoose.model('shipments', shipmentSchema)
