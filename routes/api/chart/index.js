const { chart } = require('@/controller')
const { auth, validator } = require('@/middleware')

const router = require('express').Router()
const { chart: chartValidations } = require('@/validations')

router.use(auth.protect)

router.get('/attempts',
  validator.validate(chartValidations.chart),
  chart.attempts)

router.get('/report',
  validator.validate(chartValidations.chart),
  chart.report)

router.get('/status-report',
  validator.validate(chartValidations.chart),
  chart.statusReport)

module.exports = router
