const mongoose = require('mongoose')
const { Schema } = mongoose
const ObjectId = Schema.Types.ObjectId

const callSchema = new Schema(
  {
    disposition: { type: ObjectId, ref: 'dispositions' },
    shipment: { type: ObjectId, ref: 'shipments' },

    shipmentNumber: { type: String },
    originCity: { type: String },
    destinationCity: { type: String },
    pickupDate: { type: String },
    delivaryDate: { type: String },
    carrierId: { type: String },
    carrierName: { type: String },
    dispatcherName: { type: String },
    carrierEmail: { type: String },
    probillNumber: { type: String },

    toPhone: { type: String, required: true, trim: true },
    fromPhone: { type: String, required: true, trim: true },

    callId: { type: String, default: '', trim: true },
    voice: { type: String },
    transcriptionId: { type: String, default: '', trim: true },
    transcriptionText: { type: String, default: '', trim: true },
    recordingUrl: { type: String, default: '', trim: true },
    duration: { type: Number, default: 0, min: 0 },
    outcome: { type: String, default: 'pending' },

    status: {
      type: String,
      required: true,
      enum: [
        'queued', 'initiate', 'ringing', 'in-progress', 'completed',
        'busy', 'not-reachable', 'no-answer', 'failed', 'cancelled', 'schedule', 'deleted'
      ]
    },

    parentId: { type: ObjectId, ref: 'calls' },
    rootId: { type: ObjectId, ref: 'calls' },

    attempt: { type: Number, default: 1, min: 1 },
    priority: { type: Number, default: 10, min: 1, max: 10 },

    initiatedAt: { type: Date },
    scheduledAt: { type: Date }
  },
  {
    timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' },
    versionKey: false
  }
)

callSchema.index({ user: 1 })
callSchema.index({ user: 1, status: 1 })
callSchema.index({ status: 1, scheduledAt: 1, priority: -1 })
callSchema.index({ rootId: 1 })
callSchema.index({ shipmentNumber: 1 })

module.exports = mongoose.model('calls', callSchema)
