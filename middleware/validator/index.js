const validate = (options = {}) => {
  return (req, res, next) => {
    const validationResults = []
    if (options.bodySchema) {
      const { error: bodyError } = options.bodySchema.validate(req.body, { abortEarly: true })
      if (bodyError) {
        validationResults.push(
          bodyError.details.map(err => err.message)
        )
      }
    }

    if (options.paramsSchema) {
      const { error: paramsError } = options.paramsSchema.validate(req.params, { abortEarly: true })
      if (paramsError) {
        validationResults.push(
          paramsError.details.map(err => err.message)
        )
      }
    }

    if (options.querySchema) {
      const { error: queryError } = options.querySchema.validate(req.query, { abortEarly: true })
      if (queryError) {
        validationResults.push(
          queryError.details.map(err => err.message)
        )
      }
    }

    // If any validation errors exist, create an AppError
    if (validationResults.length > 0) {
      const errorMessage = validationResults.flat().join('; ')
      return res.status(400).json({
        status: 'fail',
        message: errorMessage
      })
    }

    next()
  }
}

module.exports = { validate }
