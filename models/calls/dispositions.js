const { default: mongoose } = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const dispositionSchema = new mongoose.Schema({
  call: { type: ObjectId, ref: 'calls', required: true },
  summary: { type: String },
  remark: { type: String },
  subRemark: { type: String },
  emailSent: { type: Boolean, default: false },
  eventCreated: { type: Boolean, default: false },
  receiver: { type: String },

  callbackDateTime: { type: String, default: 'N/A' },
  classXPassStatus: { type: String, default: 'N/A' },
  classXOverallMarks: { type: String, default: 'N/A' },
  postFailPlan: { type: String, default: 'N/A' },
  classXIAdmissionStatus: { type: String, default: 'N/A' },
  classXISchoolType1: { type: String, default: 'N/A' },
  classXISchoolType2: { type: String, default: 'N/A' },
  classXISchoolName: { type: String, default: 'N/A' },
  classXIBoard: { type: String, default: 'N/A' },
  classXIStreamChosen: { type: String, default: 'N/A' },
  dropOutAfterXReason: { type: String, default: 'N/A' },
  classXIAdmissionProof: { type: String, default: 'N/A' }
}, { timestamps: true })

module.exports = mongoose.model('dispositions', dispositionSchema)
