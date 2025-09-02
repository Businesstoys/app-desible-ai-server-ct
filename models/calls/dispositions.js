const { default: mongoose } = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const dispositionSchema = new mongoose.Schema({
  call: { type: ObjectId, ref: 'calls', required: true },
  summary: { type: String },
  remark: { type: String },
  subRemark: { type: String },
  receiver: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('dispositions', dispositionSchema)
