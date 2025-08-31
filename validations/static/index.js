const Joi = require('joi')

const config = {
  bodySchema: Joi.object({
    voiceId: Joi.string().required().messages({
      'any.required': 'Voice Id is required',
      'string.empty': 'Voice Id cannot be empty'
    }),
    phoneNumber: Joi.string().required().messages({
      'any.required': 'Phone Number is required',
      'string.empty': 'Phone Number cannot be empty'
    }),
    prompt: Joi.string().required().messages({
      'any.required': 'Prompt is required',
      'string.base': 'Prompt must be a string'
    })
  }).unknown(false)
}

module.exports = {
  config
}
