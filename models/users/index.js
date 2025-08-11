const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const { Schema } = mongoose

const userSchema = new Schema(
  {
    email: { type: String, unique: true, required: true, trim: true, lowercase: true },
    name: { type: String, trim: true, required: true },
    mobileNumber: { type: String, trim: true, required: true },
    password: { type: String, required: true, minlength: 6 },
    calls: [{ type: Schema.Types.ObjectId, ref: 'Call' }]
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  try {
    const saltRounds = 10
    this.password = await bcrypt.hash(this.password, saltRounds)
    next()
  } catch (err) {
    next(err)
  }
})

userSchema.methods.checkPassword = function (inputPassword) {
  return bcrypt.compare(inputPassword, this.password)
}

module.exports = mongoose.model('users', userSchema)
