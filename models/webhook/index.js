const mongoose = require('mongoose')
const ObjectId = (mongoose.Types.ObjectId)
const { Schema } = mongoose

const webhookSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: 'users', required: true },
  callId: { type: String, required: true },
  statusCode: { type: Number, default: '' },
  responseBody: { type: Schema.Types.Mixed },
  errorMessage: { type: String, default: '' }
}, { timestamps: true })

module.exports = mongoose.model('webhooks', webhookSchema)
