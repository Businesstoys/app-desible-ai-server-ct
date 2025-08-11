const Joi = require('joi')

const login = {
  bodySchema: Joi.object({
    token: Joi.string().required().messages({
      'string.base': 'Token must be a string',
      'any.required': 'Microsoft token is required'
    })
  })
}

module.exports = {
  login
}
