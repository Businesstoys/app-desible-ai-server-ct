const mongoose = require('mongoose')
const { Schema } = mongoose

const shipmentSchema = new Schema(
  {
    number: { type: String, required: true },
    tripNumber: { type: String },
    status: { type: String },

    rateType: { type: String },
    mode: { type: String },
    modeId: { type: String },

    plannedAt: { type: Date },
    shippedAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    canceledAt: { type: Date },

    cost: { type: String, default: '' },
    revenue: { type: String, default: '' },
    miles: { type: String },

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

    lastModifiedTimeUtc: { type: Date }
  },
  {
    timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' },
    versionKey: false
  }
)

module.exports = mongoose.model('shipments', shipmentSchema)
