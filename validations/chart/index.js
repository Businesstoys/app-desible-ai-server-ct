const Joi = require('joi')

const chart = {
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

module.exports = {
  chart
}
