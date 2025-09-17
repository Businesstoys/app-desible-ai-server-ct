const Joi = require('joi')

const shipmentItemSchema = Joi.object({
  Number: Joi.alternatives(Joi.string(), Joi.number())
    .required()
    .messages({
      'any.required': 'Shipment Number is required'
    }),

  PickedUp: Joi.string()
    .isoDate()
    .required()
    .messages({
      'any.required': 'PickedUp is required',
      'string.isoDate': 'PickedUp must be an ISO 8601 date string'
    }),

  Delivered: Joi.string()
    .isoDate()
    .required()
    .messages({
      'any.required': 'Delivered is required',
      'string.isoDate': 'Delivered must be an ISO 8601 date string'
    }),

  Origin: Joi.object({
    City: Joi.string().required().messages({
      'any.required': 'Origin.City is required'
    })
  })
    .required()
    .messages({
      'any.required': 'Origin is required'
    })
    .unknown(true),

  Destination: Joi.object({
    City: Joi.string().required().messages({
      'any.required': 'Destination.City is required'
    })
  })
    .required()
    .messages({
      'any.required': 'Destination is required'
    })
    .unknown(true),

  Carriers: Joi.array()
    .items(
      Joi.object({
        Name: Joi.string().required().messages({
          'any.required': 'Carriers[].Name is required'
        }),
        Phone: Joi.string().required().messages({
          'any.required': 'Carriers[].Phone is required'
        }),
        DispatcherName: Joi.string().required().messages({
          'any.required': 'Carriers[].DispatcherName is required'
        })
      }).unknown(true) // allow other carrier fields
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'Carriers must be an array',
      'array.min': 'At least one carrier is required',
      'any.required': 'Carriers is required'
    })
})
  .unknown(true)
  .messages({
    'object.base': 'Each shipment must be an object'
  })

const webhookBody = Joi.array()
  .items(shipmentItemSchema)
  .min(1)
  .required()
  .messages({
    'array.base': 'Payload must be an array of shipments',
    'array.min': 'At least one shipment is required',
    'any.required': 'Payload is required'
  })

module.exports = { webhookBody }
