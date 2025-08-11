const Joi = require('joi')

const createTemplate = {
  bodySchema: Joi.object({
    name: Joi.string().trim().required().messages({
      'any.required': 'Template name is required',
      'string.base': 'Template name must be a string',
      'string.empty': 'Template name cannot be empty'
    }),

    prompt: Joi.string().allow('').messages({
      'string.base': 'Prompt must be a string'
    }),

    voices: Joi.array()
      .items(
        Joi.object({
          value: Joi.string().required().messages({
            'any.required': 'Voice value is required',
            'string.base': 'Voice value must be a string'
          }),
          label: Joi.string().required().messages({
            'any.required': 'Voice label is required',
            'string.base': 'Voice label must be a string'
          })
        })
      )
      .min(1)
      .required()
      .messages({
        'array.base': 'Voices must be an array',
        'array.min': 'At least one voice is required',
        'any.required': 'Voices are required'
      })
  }).unknown(false)
}

const uploadVoice = {
  querySchema: Joi.object({
    templateId: Joi.string()
      .length(24)
      .hex()
      .required()
      .messages({
        'string.base': 'Template ID must be a string',
        'string.length': 'Template ID must be 24 characters long',
        'string.hex': 'Template ID must be a valid ObjectID',
        'any.required': 'Template ID is required in query parameters'
      }),

    voiceId: Joi.string()
      .required()
      .messages({
        'string.base': 'Voice ID must be a string',
        'any.required': 'Voice ID is required in query parameters'
      })
  })
}

module.exports = {
  createTemplate,
  uploadVoice
}
