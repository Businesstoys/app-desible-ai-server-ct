const Joi = require('joi')

const voice = {
  querySchema: Joi.object({
    templateId: Joi.string()
      .length(24)
      .hex()
      .required()
      .messages({
        'string.base': 'Template ID must be a string',
        'string.length': 'Template ID must be 24 characters long',
        'string.hex': 'Template ID must be a valid MongoDB ObjectID',
        'any.required': 'Template ID is required in query'
      }),

    voiceId: Joi.string()
      .length(24)
      .hex()
      .required()
      .messages({
        'string.base': 'Voice ID must be a string',
        'string.length': 'Voice ID must be 24 characters long',
        'string.hex': 'Voice ID must be a valid MongoDB ObjectID',
        'any.required': 'Voice ID is required in query'
      })
  })
}

module.exports = {
  voice
}
