const mongoose = require('mongoose')

const voiceSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false }) // _id: false if you don't want subdocument IDs

const staticSchema = new mongoose.Schema({
  isQueueRunning: { type: Boolean, default: true },
  serverCapacity: { type: Number, default: 0 },
  phoneNumbers: [{ type: String }], // Array of phone numbers
  voices: [voiceSchema], // Array of voice objects

  prompt: { type: String },
  selectedNumber: { type: String },
  selectedVoice: { type: String },

  updatedOn: { type: Date, default: Date.now },
  createdOn: { type: Date, default: Date.now }
})

module.exports = mongoose.model('statics', staticSchema)
