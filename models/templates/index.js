const mongoose = require('mongoose')
const { Schema } = mongoose

const templateSchema = new Schema({
  name: { type: String, required: true },
  prompt: { type: String, required: true },
  voices: [
    {
      value: { type: String, required: true },
      label: { type: String, required: true },
      url: { type: String, default: '' },
      gender: { type: String, enum: ['Male', 'Famle'] }
    }
  ],
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now }
})

module.exports = mongoose.model('templates', templateSchema)
