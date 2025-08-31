const router = require('express').Router()
const { auth, validator } = require('@/middleware')

const { call } = require('@/controller')
const { call: callValidations } = require('@/validations')

// router.get('/summary/:id', calls.summary)

router.use(auth.protect)

// router.post('/export', calls.exportDetails)

// router.get('/remove/:id',
//   validator.validate(callValidations.deleteCall),
//   calls.remove)

// router.get('/kpi',
//   validator.validate(callValidations.kpi),
//   calls.kpi)

router.get('/list',
  validator.validate(callValidations.callList),
  call.list)

// router.get('/delete/:id', calls.deleteCall)

module.exports = router
