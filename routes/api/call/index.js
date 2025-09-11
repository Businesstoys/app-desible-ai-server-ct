const router = require('express').Router()
const { auth, validator } = require('@/middleware')

const { call } = require('@/controller')
const { call: callValidations } = require('@/validations')

// router.get('/summary/:id', calls.summary)

router.use(auth.protect)

router.post('/export', call.exportDetails)
router.post('/remove', call.remove)

router.get('/kpi',
  validator.validate(callValidations.kpi),
  call.kpi)

router.get('/list',
  validator.validate(callValidations.callList),
  call.list)

router.post('/shipment', call.trackShipment),

router.post('/update-outcome', call.updateCallOutcome)

module.exports = router
