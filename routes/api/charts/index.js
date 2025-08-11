const { charts } = require('@/controller')
const { auth, validator } = require('@/middleware')

const router = require('express').Router()
const { charts: chartValidations } = require('@/validations')

router.use(auth.protect)

router.get('/attempts',
  validator.validate(chartValidations.chart),
  charts.attempts)

router.get('/report',
  validator.validate(chartValidations.chart),
  charts.report)

router.get('/status-report',
  validator.validate(chartValidations.chart),
  charts.statusReport)

module.exports = router
