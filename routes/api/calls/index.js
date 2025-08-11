const router = require('express').Router()
const { auth, validator } = require('@/middleware')

const { calls } = require('@/controller')
const { calls: callValidations } = require('@/validations')

router.get('/summary/:id', calls.summary)

router.use(auth.protect)

router.post('/file-upload', calls.upload)

router.post('/initiate',
  validator.validate(callValidations.initiateCall),
  calls.initiate)

router.post('/export', calls.exportDetails)

router.get('/pending', calls.pending)

router.post('/udpate',
  validator.validate(callValidations.updateCall),
  calls.update)

router.get('/remove/:id',
  validator.validate(callValidations.deleteCall),
  calls.remove)

router.get('/kpi',
  validator.validate(callValidations.kpi),
  calls.kpi)

router.get('/list',
  validator.validate(callValidations.callList),
  calls.list)

router.post('/update-status',
  validator.validate(callValidations.updateCallStatus),
  calls.updateStatus)

router.get('/hang-up/:id',
  validator.validate(callValidations.deleteCall),
  calls.hangUp)

router.post('/feedback/:id',
  validator.validate(callValidations.feedback),
  calls.feedback)

router.get('/summary/:id', calls.summary)

router.get('/delete/:id', calls.deleteCall)

module.exports = router
