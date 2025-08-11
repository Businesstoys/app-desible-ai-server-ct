const mongoose = require('mongoose')
const ObjectId = (mongoose.Types.ObjectId)

const CallsLogsSchema = new mongoose.Schema({
  log: { type: String, enum: ['info', 'error', 'success'] },
  content: { type: String, trim: true },
  callId: { type: ObjectId }
}, { timestamps: true })

module.exports = mongoose.model('call-logs', CallsLogsSchema)
