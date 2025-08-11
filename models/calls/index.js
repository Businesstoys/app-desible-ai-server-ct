const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const callSchema = new mongoose.Schema({
  user: { type: ObjectId, ref: 'users', required: true },
  template: { type: ObjectId, ref: 'templates' },
  disposition: { type: ObjectId, ref: 'dispositions' },
  voiceId: { type: ObjectId },
  leadId: { type: String },

  toPhone: { type: String, required: true },
  fromPhone: { type: String, required: true },
  callId: { type: String, default: '' },
  transcriptionId: { type: String, default: '' },
  transcriptionText: { type: String, default: '' },
  recordingUrl: { type: String, default: '' },
  duration: { type: String, default: '' },
  status: {
    type: String,
    required: true,
    enum: [
      'pending', 'queued', 'initiate', 'ringing', 'in-progress', 'completed',
      'busy', 'not-reachable', 'no-answer', 'failed', 'cancelled', 'hang-up', 'schedule'
    ]
  },
  priority: { type: Number, default: 10, min: 1, max: 10 },

  parentId: { type: ObjectId, ref: 'calls' },
  rootId: { type: ObjectId, ref: 'calls' },
  chain: [{ type: ObjectId, ref: 'calls' }],
  attempt: { type: Number, default: 1 },
  overrideSlot: { type: Boolean, default: false },
  phase: {
    name: { type: String, enum: ['immediate', 'fallback'], default: 'fallback' },
    attempts: { type: Number, default: 0 }
  },

  studentName: { type: String, required: true },
  schoolName: { type: String, required: true, trim: true },
  counselorName: { type: String, required: true, trim: true, lowercase: true },
  location: { type: String, required: true, default: '' },
  class: { type: String, required: true, default: '' },
  gender: { type: String, required: true, default: '' },
  uid: { type: String, required: true, default: '' },
  agentName: { type: String, default: '' },

  updatedOn: { type: Date, default: Date.now },
  createdOn: { type: Date, default: Date.now },
  initiatedAt: { type: Date },
  closedAt: { type: Date },
  scheduledAt: { type: Date }
})

callSchema.index({ user: 1 })
callSchema.index({ user: 1, status: 1 })
callSchema.index({ user: 1, _id: 1 })

module.exports = mongoose.model('calls', callSchema)
