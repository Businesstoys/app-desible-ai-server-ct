const mongoose = require('mongoose')

const voiceSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false })

const staticSchema = new mongoose.Schema({
  isQueueRunning: { type: Boolean, default: true },
  serverCapacity: { type: Number, default: 0 },
  phoneNumbers: [{ type: String }],
  voices: [voiceSchema],

  prompt: { type: String },
  selectedNumber: { type: String },
  selectedVoice: { type: String },

  updatedOn: { type: Date, default: Date.now },
  createdOn: { type: Date, default: Date.now }
})

module.exports = mongoose.model('statics', staticSchema)
