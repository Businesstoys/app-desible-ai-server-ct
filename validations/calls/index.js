const Joi = require('joi')

const updateCall = {
  bodySchema: Joi.object({
    toPhone: Joi.string()
      .pattern(/^\+\d{10,15}$/)
      .messages({
        'string.base': 'To phone must be a string',
        'string.pattern.base': 'To phone must be in international format (e.g., +911234567890)'
      }),
    _id: Joi.string()
      .trim()
      .messages({
        'string.base': 'id is required'
      }),
    agentName: Joi.string()
      .trim()
      .messages({
        'string.base': 'Agent name must be a string'
      }),

    studentName: Joi.string()
      .trim()
      .messages({
        'string.base': 'Customer name must be a string'
      }),

    gender: Joi.string()
      .valid('Male', 'Female', 'Other')
      .messages({
        'string.base': 'Gender must be a string',
        'any.only': 'Gender must be one of: Male, Female, Other'
      })
  })
    .messages({
      'object.base': 'Invalid request format',
      'object.unknown': 'Unknown field in request body'
    })
    .unknown(false)
}

const deleteCall = {
  paramsSchema: Joi.object({
    id: Joi.string()
      .length(24)
      .hex()
      .required()
      .messages({
        'string.base': 'Call ID must be a string',
        'string.length': 'Call ID must be 24 characters long',
        'string.hex': 'Call ID must be a valid ObjectID',
        'any.required': 'Call ID is required in URL'
      })
  })
}

const initiateCall = {
  bodySchema: Joi.object({
    callId: Joi.array()
      .items(
        Joi.string()
          .regex(/^[a-f\d]{24}$/i)
          .message('Each call ID must be a valid MongoDB ObjectId')
      )
      .min(1)
      .required()
      .messages({
        'array.base': 'callId must be an array of IDs',
        'array.min': 'At least one callId must be provided',
        'any.required': 'callId is required'
      }),

    voiceId: Joi.string()
      .regex(/^[a-f\d]{24}$/i)
      .required()
      .messages({
        'string.base': 'voiceId must be a string',
        'string.pattern.base': 'voiceId must be a valid MongoDB ObjectId',
        'any.required': 'voiceId is required'
      }),

    templateId: Joi.string()
      .regex(/^[a-f\d]{24}$/i)
      .required()
      .messages({
        'string.base': 'templateId must be a string',
        'string.pattern.base': 'templateId must be a valid MongoDB ObjectId',
        'any.required': 'templateId is required'
      }),

    agentName: Joi.string()
      .trim()
      .min(1)
      .required()
      .messages({
        'string.base': 'agentName must be a string',
        'string.empty': 'agentName cannot be empty',
        'any.required': 'agentName is required'
      })
  })
    .messages({
      'object.base': 'Invalid request format',
      'object.unknown': 'Unknown field in request body'
    })
    .unknown(false)
}

const kpi = {
  querySchema: Joi.object({
    from: Joi.date().iso().messages({
      'date.base': '`from` must be a valid date',
      'date.format': '`from` must be in ISO format (YYYY-MM-DD)'
    }),
    to: Joi.date().iso().messages({
      'date.base': '`to` must be a valid date',
      'date.format': '`to` must be in ISO format (YYYY-MM-DD)'
    })
  })
}

const callList = Joi.object({
  search: Joi.string()
    .allow('')
    .optional()
    .messages({ 'string.base': 'Search must be a string' }),

  range: Joi.string()
    .pattern(/^(all|\d+)$/)
    .default('all')
    .messages({ 'string.pattern.base': 'Range must be "all" or a number of days' }),

  agent: Joi.string()
    .allow('all', '')
    .default('all')
    .messages({ 'string.base': 'Agent must be a string' }),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1',
      'number.integer': 'Page must be an integer'
    }),

  perPage: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'perPage must be a number',
      'number.min': 'perPage must be at least 1',
      'number.max': 'perPage cannot exceed 100',
      'number.integer': 'perPage must be an integer'
    })
})

const updateCallStatus = {
  bodySchema: Joi.object({
    ids: Joi.array()
      .items(
        Joi.string()
          .trim()
          .required()
          .messages({
            'string.base': 'Each ID must be a string',
            'string.empty': 'ID cannot be empty'
          })
      )
      .min(1)
      .required()
      .messages({
        'array.base': '"ids" must be an array of IDs',
        'array.min': 'At least one ID must be provided',
        'any.required': '"ids" is required'
      }),

    status: Joi.string()
      .valid(
        'pending',
        'queued',
        'initiate',
        'ringing',
        'in-progress',
        'completed',
        'busy',
        'not-reachable',
        'no-answer',
        'failed',
        'cancelled'
      )
      .required()
      .messages({
        'string.base': '"status" must be a string',
        'any.only': 'Invalid status value',
        'any.required': '"status" is required'
      })
  })
    .required()
    .messages({
      'object.base': 'Invalid request format',
      'object.unknown': 'Unknown field in request body'
    })
    .unknown(false)
}

const feedback = {
  paramsSchema: Joi.object({
    id: Joi.string()
      .length(24)
      .hex()
      .required()
      .messages({
        'string.base': 'Call ID must be a string',
        'string.length': 'Call ID must be 24 characters long',
        'string.hex': 'Call ID must be a valid ObjectID',
        'any.required': 'Call ID is required in URL'
      })
  }),

  bodySchema: Joi.object({
    quality: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .required()
      .messages({
        'number.base': 'Quality must be a number',
        'number.min': 'Quality must be at least 1',
        'number.max': 'Quality must be at most 10',
        'any.required': 'Quality is required'
      }),

    clarity: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .required()
      .messages({
        'number.base': 'Clarity must be a number',
        'number.min': 'Clarity must be at least 1',
        'number.max': 'Clarity must be at most 10',
        'any.required': 'Clarity is required'
      }),

    tone: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .required()
      .messages({
        'number.base': 'Tone must be a number',
        'number.min': 'Tone must be at least 1',
        'number.max': 'Tone must be at most 10',
        'any.required': 'Tone is required'
      }),

    overall: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .required()
      .messages({
        'number.base': 'Overall must be a number',
        'number.min': 'Overall must be at least 1',
        'number.max': 'Overall must be at most 10',
        'any.required': 'Overall is required'
      }),

    note: Joi.string()
      .max(500)
      .allow('')
      .messages({
        'string.base': 'Note must be a string',
        'string.max': 'Note can be at most 500 characters'
      })
  })
}

module.exports = {
  updateCall,
  deleteCall,
  initiateCall,
  kpi,
  callList,
  feedback,
  updateCallStatus
}
