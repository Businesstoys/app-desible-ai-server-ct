const mongoose = require('mongoose')

const staticSchema = new mongoose.Schema({
  isQueueRunning: { type: Boolean, default: true },
  serverCapacity: { type: Number, default: 0 },

  updatedOn: { type: Date, default: Date.now },
  createdOn: { type: Date, default: Date.now }
})

module.exports = mongoose.model('statics', staticSchema)
